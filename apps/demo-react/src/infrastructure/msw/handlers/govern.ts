/**
 * Mock of the govern API (see `src/infrastructure/http/govern/microcks.ts` for the endpoints: Microcks snapshots and
 * features, the Keycloak-backed `/api/admin/...` outside the Microcks API, and the demo-only routes marked
 * "proposition v2 / not in Microcks API"). The handlers delegate to the in-memory govern adapters (their seeds and their
 * state: an installed package, a new role, saved members, an approved request or a toggled flag is visible on the
 * next read) and serialise the domain into the wire DTOs. Secrets are served by `./importing.ts`.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import type { InstallOptions } from '@/domain/govern';
import { NotFoundError, ValidationError } from '@/application/shared';
import { toFeaturesConfig, toKeycloakGroup, toKeycloakUser, toRole } from '@/infrastructure/http/govern/mapping';
import { KEYCLOAK_FLAG, SNAPSHOT_FILE_NAME, type DemoSnapshotImportResult, type MicrocksKeycloakConfig } from '@/infrastructure/http/govern/microcks';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createInMemoryGovernAdapters, type GovernAdapters } from '@/infrastructure/in-memory/govern';
import { API } from './api';

/** The application errors of the in-memory adapters, as the HTTP statuses the client maps back. */
async function answer(produce: () => Promise<Response>): Promise<Response> {
  try {
    return await produce();
  } catch (error) {
    if (error instanceof NotFoundError) return HttpResponse.json({ entity: error.entity, id: error.id }, { status: 404 });
    if (error instanceof ValidationError) return HttpResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}

/** Name of the multipart `file` of `POST /api/import` and `POST /api/demo/import/preview`. */
async function snapshotFileName(request: Request): Promise<string | undefined> {
  const file = (await request.formData()).get('file');
  return file instanceof Blob && 'name' in file && typeof file.name === 'string' ? file.name : undefined;
}

const noFile = () => HttpResponse.json({ message: 'Snapshot file content is empty' }, { status: 400 });

/** Fresh handlers over their own in-memory state (one set for the app, one per contract test). */
export function createGovernHandlers(adapters: GovernAdapters = createInMemoryGovernAdapters({ clock: new FixedClock() })): HttpHandler[] {
  const { hub, admin } = adapters;
  const id = (params: Record<string, unknown>) => String(params.id);

  async function keycloakUser(userId: string) {
    const [users, groups] = await Promise.all([admin.users(), admin.groups()]);
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundError('User', userId);
    return toKeycloakUser(user, groups);
  }

  async function keycloakConfig(): Promise<MicrocksKeycloakConfig> {
    const enabled = (await admin.flags()).find((f) => f.id === KEYCLOAK_FLAG)?.enabled ?? false;
    return { realm: 'microcks', 'auth-server-url': 'http://keycloak.local:8180', 'public-client': true, 'ssl-required': 'none', resource: 'microcks-app', enabled };
  }

  return [
    // Microcks snapshots.
    http.get(`${API}/export`, async ({ request }) => {
      const serviceIds = new URL(request.url).searchParams.getAll('serviceIds');
      const snapshot = await admin.snapshot(serviceIds);
      return HttpResponse.json(JSON.parse(snapshot.json), { headers: { 'content-disposition': `attachment; filename=${SNAPSHOT_FILE_NAME}` } });
    }),
    http.post(`${API}/import`, async ({ request }) => {
      const fileName = await snapshotFileName(request);
      if (!fileName) return noFile();
      // Proposition v2 / not in Microcks API: Microcks answers 201 without a body.
      return HttpResponse.json<DemoSnapshotImportResult>(await admin.importSnapshot(fileName), { status: 201 });
    }),

    // Microcks configuration.
    http.get(`${API}/features/config`, async () => HttpResponse.json(toFeaturesConfig(await admin.flags()))),
    http.get(`${API}/keycloak/config`, async () => HttpResponse.json(await keycloakConfig())),

    // Outside the Microcks API (Keycloak): users, roles, groups and membership requests.
    http.get(`${API}/admin/users`, async () => {
      const [users, groups] = await Promise.all([admin.users(), admin.groups()]);
      return HttpResponse.json(users.map((u) => toKeycloakUser(u, groups)));
    }),
    http.put(`${API}/admin/users/:id/roles`, ({ params, request }) =>
      answer(async () => {
        const roles = (await request.json()) as string[] | null;
        if (!Array.isArray(roles)) return HttpResponse.json({ message: 'a list of realm roles is required' }, { status: 400 });
        await admin.setRole(id(params), toRole(roles));
        return HttpResponse.json(await keycloakUser(id(params)));
      }),
    ),
    http.get(`${API}/admin/groups`, async () => HttpResponse.json((await admin.groups()).map(toKeycloakGroup))),
    http.put(`${API}/admin/groups/:id/members`, ({ params, request }) =>
      answer(async () => {
        const members = (await request.json()) as string[] | null;
        if (!Array.isArray(members)) return HttpResponse.json({ message: 'a list of user ids is required' }, { status: 400 });
        return HttpResponse.json(toKeycloakGroup(await admin.saveMembers(id(params), members)));
      }),
    ),
    http.get(`${API}/admin/requests`, async () => HttpResponse.json(await admin.requests())),
    http.post(`${API}/admin/requests/:id/approve`, ({ params }) =>
      answer(async () => {
        await admin.approveRequest(id(params));
        return new HttpResponse(null, { status: 204 });
      }),
    ),

    // Proposition v2 / not in Microcks API.
    http.get(`${API}/demo/hub/packages`, async ({ request }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get('query') ?? undefined;
      const category = url.searchParams.get('category') ?? undefined;
      return HttpResponse.json(await hub.list({ ...(query ? { query } : {}), ...(category ? { category } : {}) }));
    }),
    http.get(`${API}/demo/hub/categories`, async () => HttpResponse.json(await hub.categories())),
    http.get(`${API}/demo/hub/packages/:id`, ({ params }) =>
      answer(async () => {
        const found = await hub.get(id(params));
        if (!found) throw new NotFoundError('Package', id(params));
        return HttpResponse.json(found);
      }),
    ),
    http.post(`${API}/demo/hub/packages/:id/install`, ({ params, request }) =>
      answer(async () => HttpResponse.json(await hub.install(id(params), (await request.json()) as InstallOptions))),
    ),
    http.get(`${API}/demo/snapshot/services`, async () => HttpResponse.json(await admin.snapshotServices())),
    http.post(`${API}/demo/import/preview`, async ({ request }) => {
      const fileName = await snapshotFileName(request);
      return fileName ? HttpResponse.json(await admin.snapshotImportPreview(fileName)) : noFile();
    }),
    http.put(`${API}/demo/features/:id`, ({ params, request }) =>
      answer(async () => {
        const body = (await request.json()) as { enabled?: unknown } | null;
        if (typeof body?.enabled !== 'boolean') return HttpResponse.json({ message: 'enabled (boolean) is required' }, { status: 400 });
        return HttpResponse.json(await admin.setFlag(id(params), body.enabled));
      }),
    ),
  ];
}
