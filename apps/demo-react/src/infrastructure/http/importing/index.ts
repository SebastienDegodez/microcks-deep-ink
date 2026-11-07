/**
 * HTTP adapters of the importing feature, over the Microcks jobs, artifact and secrets API (see `./microcks.ts` for
 * the endpoints and the demo-only extensions).
 *
 * Imports: the analysed preview tells how its source is imported, as in Microcks: a file is uploaded
 * (`POST /api/artifact/upload`), a URL is downloaded (`POST /api/artifact/download`), a Git repository becomes a
 * scheduled job (`POST /api/jobs`). The done screen is then read from the demo-only `import-results`.
 *
 * Synchronisations (`run`): Microcks has no progress stream for a job (`PUT /api/jobs/{id}/start` answers at once and
 * imports in the background). `run` starts the job, then replays the progress 25, 50, 75, 100 on the client, one per
 * tick (1200 ms), exactly like the in-memory adapter.
 */
import type { ImportPreview, ImportResult, ImportSource, ImporterDiff, RecentImport } from '@/domain/importing';
import type { SecretSummary } from '@/domain/shared';
import type { ImportGateway, ImporterRepository, SecretRepository } from '@/application/ports/importing';
import type { ImportHistory } from '@/application/importing';
import type { Clock } from '@/application/ports/shared';
import { NotFoundError } from '@/application/shared';
import type { HttpClient } from '@/infrastructure/http/client';
import { createSequenceStream } from '@/infrastructure/in-memory/shared/stream';
import { toImporter, toMicrocksSecretRequest, toSecretSummary } from './mapping';
import { PREVIEW_ID_FIELD, SECRET_ID_FIELD, type MicrocksCounter, type MicrocksImportJob, type MicrocksSecret } from './microcks';

export interface HttpImportingDeps {
  http: HttpClient;
  clock: Clock;
}

export interface HttpImportingAdapters {
  gateway: ImportGateway;
  importers: ImporterRepository;
  secrets: SecretRepository;
  history: ImportHistory;
  clock: Clock;
}

const PROGRESS = [25, 50, 75, 100];

export function createHttpImportingAdapters({ http, clock }: HttpImportingDeps): HttpImportingAdapters {
  const job = (id: string) => `jobs/${encodeURIComponent(id)}`;
  const secret = (id: string) => `secrets/${encodeURIComponent(id)}`;
  /** Sources of the previews analysed here: they choose the import endpoint. */
  const sources = new Map<string, ImportSource>();

  /** Every item of a Microcks paged list (pages by 20 by default): the count, then one page of that size. */
  async function all<T>(resource: 'jobs' | 'secrets'): Promise<T[]> {
    const { counter } = await http.get<MicrocksCounter>(`${resource}/count`);
    return counter === 0 ? [] : http.get<T[]>(resource, { query: { page: 0, size: counter } });
  }

  async function fetchJob(id: string): Promise<MicrocksImportJob | undefined> {
    try {
      // Microcks answers an unknown id with 200 and an empty body.
      return (await http.get<MicrocksImportJob | null | undefined>(job(id))) ?? undefined;
    } catch (error) {
      if (error instanceof NotFoundError) return undefined;
      throw error;
    }
  }

  const gateway: ImportGateway = {
    async analyze(source) {
      const preview = await http.post<ImportPreview>('demo/artifact/analyze', source);
      sources.set(preview.previewId, preview.source);
      return preview;
    },
    async import(previewId, options) {
      const source = sources.get(previewId);
      const mainArtifact = options.role === 'primary';
      if (source?.kind === 'git') {
        const request: MicrocksImportJob = {
          name: source.name ?? source.repository,
          repositoryUrl: source.repository,
          mainArtifact,
          active: true,
          ...(source.insecure ? { repositoryDisableSSLValidation: true } : {}),
          ...(source.secretName ? { secretRef: { secretId: options.secretId ?? source.secretName, name: source.secretName } } : {}),
          demo: { previewId, ...(options.secretId ? { secretId: options.secretId } : {}) },
        };
        await http.post<MicrocksImportJob>('jobs', request);
      } else if (source?.kind === 'url') {
        const form = new URLSearchParams({ url: source.url, mainArtifact: String(mainArtifact), [PREVIEW_ID_FIELD]: previewId });
        if (source.secretName) form.set('secretName', source.secretName);
        if (options.secretId) form.set(SECRET_ID_FIELD, options.secretId);
        await http.post<string>('artifact/download', form);
      } else {
        // Files, and previews analysed elsewhere (the server answers 404 when it does not know them).
        const form = new FormData();
        const file = source?.kind === 'file' ? source.files[0] : undefined;
        form.append('file', new Blob([], { type: 'application/octet-stream' }), file?.name ?? 'artifact');
        form.append(PREVIEW_ID_FIELD, previewId);
        if (options.secretId) form.append(SECRET_ID_FIELD, options.secretId);
        await http.post<string>('artifact/upload', form, { query: { mainArtifact } });
      }
      return http.get<ImportResult>(`demo/import-results/${encodeURIComponent(previewId)}`);
    },
    createDirectApi: (input) => http.post<ImportResult>('demo/direct-apis', input),
  };

  const importers: ImporterRepository = {
    async list() {
      return (await all<MicrocksImportJob>('jobs')).map(toImporter);
    },
    async get(id) {
      const dto = await fetchJob(id);
      return dto ? toImporter(dto) : undefined;
    },
    async setActive(id, active) {
      return toImporter(await http.put<MicrocksImportJob>(`${job(id)}/${active ? 'activate' : 'stop'}`));
    },
    async remove(id) {
      await http.delete(job(id));
    },
    async restore(id) {
      return toImporter(await http.post<MicrocksImportJob>(`demo/${job(id)}/restore`));
    },
    run(id) {
      return (listener) => {
        let stop: (() => void) | undefined;
        let cancelled = false;
        // The progress starts once Microcks has started the job, so the job is done when 100 is emitted.
        http.put<MicrocksImportJob>(`${job(id)}/start`).then(
          () => {
            if (!cancelled) stop = createSequenceStream(PROGRESS)(listener);
          },
          () => undefined,
        );
        return () => {
          cancelled = true;
          stop?.();
        };
      };
    },
    diff: (id, from, to) => http.get<ImporterDiff>(`demo/${job(id)}/diff`, { query: { from, to } }),
  };

  const secrets: SecretRepository = {
    async list() {
      return (await all<MicrocksSecret>('secrets')).map(toSecretSummary);
    },
    async create(input) {
      return toSecretSummary(await http.post<MicrocksSecret>('secrets', toMicrocksSecretRequest(input.name, input)));
    },
    async update(id, input): Promise<SecretSummary> {
      // Microcks replaces the whole secret: its name is read first (it never changes).
      const current = await http.get<MicrocksSecret>(secret(id));
      return toSecretSummary(await http.put<MicrocksSecret>(secret(id), toMicrocksSecretRequest(current.name, input)));
    },
    async remove(id) {
      await http.delete(secret(id));
    },
  };

  const history: ImportHistory = {
    recent: (limit) => http.get<RecentImport[]>('demo/recent-imports', { query: { size: limit } }),
  };

  return { gateway, importers, secrets, history, clock };
}
