/**
 * Mock of the Microcks jobs, artifact and secrets API (see `src/infrastructure/http/importing/microcks.ts` for the
 * endpoints and the demo-only extensions, marked "proposition v2 / not in Microcks API"). The handlers delegate to the
 * in-memory importing adapters (their seeds and their state: a paused, started, deleted or restored job, an import or
 * a secret change is visible on the next read) and serialise the domain into Microcks DTOs.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import type { DirectApiInput, ImportOptions, ImportResult, ImportSource, Importer } from '@/domain/importing';
import type { SecretSummary } from '@/domain/shared';
import { NotFoundError, ValidationError } from '@/application/shared';
import { toSecretInput } from '@/infrastructure/http/importing/mapping';
import { PREVIEW_ID_FIELD, SECRET_ID_FIELD, type MicrocksImportJob, type MicrocksSecret } from '@/infrastructure/http/importing/microcks';
import { FixedClock } from '@/infrastructure/in-memory/shared';
import { createInMemoryImportingAdapters, type ImportingAdapters } from '@/infrastructure/in-memory/importing';
import { API } from './api';

/** Microcks pages its lists by 20 by default. */
const DEFAULT_PAGE_SIZE = 20;

/** Importer -> Microcks `ImportJob` (+ the demo extension). */
export function toMicrocksImportJob(importer: Importer): MicrocksImportJob {
  const createdDate = Date.parse(importer.createdAt);
  const lastImportDate = importer.lastSyncAt ? Date.parse(importer.lastSyncAt) : undefined;
  return {
    id: importer.id,
    name: importer.name,
    repositoryUrl: importer.url,
    repositoryDisableSSLValidation: !importer.sslValidation,
    createdDate,
    ...(lastImportDate !== undefined ? { lastImportDate } : {}),
    ...(importer.error ? { lastImportError: importer.error.message } : {}),
    active: importer.active,
    serviceRefs: importer.produces.map((s) => ({ serviceId: s.id ?? '', name: s.name, version: s.version })),
    metadata: {
      createdOn: createdDate,
      lastUpdate: lastImportDate ?? createdDate,
      labels: Object.fromEntries(importer.labels.map((l) => [l.key, l.value])),
    },
    ...(importer.secretName ? { secretRef: { secretId: `secret-${importer.secretName}`, name: importer.secretName } } : {}),
    mainArtifact: importer.role === 'primary',
    demo: {
      kind: importer.kind,
      origin: importer.origin,
      state: importer.state,
      schedule: importer.schedule,
      versions: importer.versions,
      artifactLabel: importer.artifactLabel,
      artifactNote: importer.artifactNote,
      secretType: importer.secretType,
      createdBy: importer.createdBy,
      serviceProtocols: importer.produces.map((s) => s.protocol),
      workflows: importer.workflows,
      producedLabel: importer.producedLabel,
      health: importer.health,
      error: importer.error,
      warning: importer.warning,
      timeline: importer.timeline,
    },
  };
}

/** Secret summary -> Microcks `Secret` (+ the demo extension), never the value. */
export function toMicrocksSecret(secret: SecretSummary): MicrocksSecret {
  return {
    id: secret.id,
    name: secret.name,
    ...(secret.description !== undefined ? { description: secret.description } : {}),
    demo: { kind: secret.kind, masked: secret.masked, detail: secret.detail, usedBy: secret.usedBy, createdAt: secret.createdAt, updatedAt: secret.updatedAt },
  };
}

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

function page<T>(items: readonly T[], url: URL): T[] {
  const int = (name: string, fallback: number) => {
    const value = Number(url.searchParams.get(name));
    return url.searchParams.has(name) && Number.isInteger(value) && value >= 0 ? value : fallback;
  };
  const size = int('size', DEFAULT_PAGE_SIZE);
  const from = int('page', 0) * size;
  return items.slice(from, from + size);
}

/** Fresh handlers over their own in-memory state (one set for the app, one per contract test). */
export function createImportingHandlers(adapters: ImportingAdapters = createInMemoryImportingAdapters({ clock: new FixedClock() })): HttpHandler[] {
  const { gateway, importers, secrets, history } = adapters;
  /** Done screens of the imports, by preview id (`GET /api/demo/import-results/{previewId}`). */
  const results = new Map<string, ImportResult>();

  async function importPreview(previewId: string | undefined, options: ImportOptions): Promise<ImportResult> {
    if (!previewId) throw new ValidationError(`The demo imports an analysed preview: "${PREVIEW_ID_FIELD}" is required.`);
    const result = await gateway.import(previewId, options);
    results.set(previewId, result);
    return result;
  }

  const options = (main: boolean, secretId: string | undefined): ImportOptions => ({ role: main ? 'primary' : 'secondary', ...(secretId ? { secretId } : {}) });
  const field = (form: FormData | URLSearchParams, name: string) => {
    const value = form.get(name);
    return typeof value === 'string' && value !== '' ? value : undefined;
  };
  const nameVersion = (result: ImportResult) => HttpResponse.text(`${result.name}:${result.version}`, { status: 201 });
  const jobOr404 = async (id: string) => {
    const found = await importers.get(id);
    if (!found) throw new NotFoundError('Importer', id);
    return HttpResponse.json(toMicrocksImportJob(found));
  };

  return [
    // Microcks jobs.
    http.get(`${API}/jobs/count`, async () => HttpResponse.json({ counter: (await importers.list()).length })),
    http.get(`${API}/jobs`, async ({ request }) => HttpResponse.json(page(await importers.list(), new URL(request.url)).map(toMicrocksImportJob))),
    http.post(`${API}/jobs`, ({ request }) =>
      answer(async () => {
        const body = (await request.json()) as Partial<MicrocksImportJob> | null;
        if (!body?.name || !body.repositoryUrl) return HttpResponse.json({ message: 'name and repositoryUrl are required' }, { status: 400 });
        const result = await importPreview(body.demo?.previewId, options(body.mainArtifact !== false, body.demo?.secretId));
        const now = adapters.clock.now().getTime();
        const created: MicrocksImportJob = {
          id: body.demo?.previewId,
          name: result.importerName ?? body.name,
          repositoryUrl: body.repositoryUrl,
          mainArtifact: body.mainArtifact !== false,
          active: true,
          createdDate: now,
          lastImportDate: now,
          serviceRefs: [{ serviceId: result.serviceId, name: result.name, version: result.version }],
          ...(body.secretRef ? { secretRef: body.secretRef } : {}),
        };
        return HttpResponse.json(created, { status: 201 });
      }),
    ),
    http.get(`${API}/jobs/:id`, async ({ params }) => {
      const found = await importers.get(String(params.id));
      // Like Microcks: an unknown id answers 200 with an empty body.
      return found ? HttpResponse.json(toMicrocksImportJob(found)) : new HttpResponse(null, { status: 200 });
    }),
    http.put(`${API}/jobs/:id/start`, ({ params }) =>
      answer(async () => {
        const id = String(params.id);
        const response = await jobOr404(id);
        // Microcks imports in the background: the synchronisation is recorded when its progress reaches 100.
        const stop = importers.run(id)((progress) => {
          if (progress >= 100) stop();
        });
        return response;
      }),
    ),
    http.put(`${API}/jobs/:id/activate`, ({ params }) => answer(async () => HttpResponse.json(toMicrocksImportJob(await importers.setActive(String(params.id), true))))),
    http.put(`${API}/jobs/:id/stop`, ({ params }) => answer(async () => HttpResponse.json(toMicrocksImportJob(await importers.setActive(String(params.id), false))))),
    http.delete(`${API}/jobs/:id`, async ({ params }) => {
      await importers.remove(String(params.id));
      return HttpResponse.json({});
    }),

    // Microcks artifacts.
    http.post(`${API}/artifact/upload`, ({ request }) =>
      answer(async () => {
        const form = await request.formData();
        if (!form.has('file')) return new HttpResponse(null, { status: 204 });
        const main = new URL(request.url).searchParams.get('mainArtifact') !== 'false';
        return nameVersion(await importPreview(field(form, PREVIEW_ID_FIELD), options(main, field(form, SECRET_ID_FIELD))));
      }),
    ),
    http.post(`${API}/artifact/download`, ({ request }) =>
      answer(async () => {
        const form = new URLSearchParams(await request.text());
        if (!field(form, 'url')) return new HttpResponse(null, { status: 204 });
        return nameVersion(await importPreview(field(form, PREVIEW_ID_FIELD), options(form.get('mainArtifact') !== 'false', field(form, SECRET_ID_FIELD))));
      }),
    ),

    // Microcks secrets.
    http.get(`${API}/secrets/count`, async () => HttpResponse.json({ counter: (await secrets.list()).length })),
    http.get(`${API}/secrets`, async ({ request }) => HttpResponse.json(page(await secrets.list(), new URL(request.url)).map(toMicrocksSecret))),
    http.post(`${API}/secrets`, async ({ request }) => {
      const body = (await request.json()) as MicrocksSecret | null;
      if (!body?.name) return HttpResponse.json({ message: 'name is required' }, { status: 400 });
      return HttpResponse.json(toMicrocksSecret(await secrets.create(toSecretInput(body))), { status: 201 });
    }),
    http.get(`${API}/secrets/:id`, ({ params }) =>
      answer(async () => {
        const id = String(params.id);
        const found = (await secrets.list()).find((s) => s.id === id);
        if (!found) throw new NotFoundError('Secret', id);
        return HttpResponse.json(toMicrocksSecret(found));
      }),
    ),
    http.put(`${API}/secrets/:id`, ({ params, request }) =>
      answer(async () => {
        const body = ((await request.json()) ?? {}) as MicrocksSecret;
        const { name: _name, ...input } = toSecretInput(body);
        return HttpResponse.json(toMicrocksSecret(await secrets.update(String(params.id), input)));
      }),
    ),
    http.delete(`${API}/secrets/:id`, async ({ params }) => {
      await secrets.remove(String(params.id));
      return new HttpResponse(null, { status: 200 });
    }),

    // Proposition v2 / not in Microcks API.
    http.post(`${API}/demo/artifact/analyze`, async ({ request }) => HttpResponse.json(await gateway.analyze((await request.json()) as ImportSource))),
    http.get(`${API}/demo/import-results/:previewId`, ({ params }) =>
      answer(async () => {
        const id = String(params.previewId);
        const result = results.get(id);
        if (!result) throw new NotFoundError('Import', id);
        return HttpResponse.json(result);
      }),
    ),
    http.get(`${API}/demo/recent-imports`, async ({ request }) => {
      const size = Number(new URL(request.url).searchParams.get('size')) || 3;
      return HttpResponse.json(await history.recent(size));
    }),
    http.post(`${API}/demo/direct-apis`, async ({ request }) => HttpResponse.json(await gateway.createDirectApi((await request.json()) as DirectApiInput), { status: 201 })),
    http.post(`${API}/demo/jobs/:id/restore`, ({ params }) => answer(async () => HttpResponse.json(toMicrocksImportJob(await importers.restore(String(params.id)))))),
    http.get(`${API}/demo/jobs/:id/diff`, ({ params, request }) =>
      answer(async () => {
        const url = new URL(request.url);
        return HttpResponse.json(await importers.diff(String(params.id), url.searchParams.get('from') ?? '', url.searchParams.get('to') ?? ''));
      }),
    ),
  ];
}
