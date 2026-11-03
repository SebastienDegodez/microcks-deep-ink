import type {
  DirectApiInput,
  ImportOptions,
  ImportPreview,
  ImportResult,
  ImportSource,
  Importer,
  ImporterDiff,
} from '@/domain/importing';
import type { SecretSummary } from '@/domain/shared';
import { NotFoundError, type Unsubscribe } from '@/application/shared';
import type { ImportGateway, ImporterRepository, SecretRepository } from '@/application/ports/importing';

export type ImportingPorts = {
  gateway: ImportGateway;
  importers: ImporterRepository;
  secrets: SecretRepository;
};

export interface ImportingUseCases {
  analyze(source: ImportSource): Promise<ImportPreview>;
  import(previewId: string, options: ImportOptions): Promise<ImportResult>;
  createDirectApi(input: DirectApiInput): Promise<ImportResult>;

  listImporters(): Promise<Importer[]>;
  /** Throws `NotFoundError`. */
  getImporter(id: string): Promise<Importer>;
  /** Streams synchronisation progress (0..100). */
  runImporter(id: string, listener: (progress: number) => void): Unsubscribe;
  setImporterActive(id: string, active: boolean): Promise<Importer>;
  deleteImporter(id: string): Promise<void>;
  undoDeleteImporter(id: string): Promise<Importer>;
  getImporterDiff(id: string, fromVersion: string, toVersion: string): Promise<ImporterDiff>;
  listSecrets(): Promise<SecretSummary[]>;
}

export function createImportingUseCases({ gateway, importers, secrets }: ImportingPorts): ImportingUseCases {
  return {
    analyze: (source) => gateway.analyze(source),
    import: (previewId, options) => gateway.import(previewId, options),
    createDirectApi: (input) => gateway.createDirectApi(input),
    listImporters: () => importers.list(),
    getImporter: async (id) => {
      const found = await importers.get(id);
      if (!found) throw new NotFoundError('Importer', id);
      return found;
    },
    runImporter: (id, listener) => importers.run(id)(listener),
    setImporterActive: (id, active) => importers.setActive(id, active),
    deleteImporter: (id) => importers.remove(id),
    undoDeleteImporter: (id) => importers.restore(id),
    getImporterDiff: (id, from, to) => importers.diff(id, from, to),
    listSecrets: () => secrets.list(),
  };
}
