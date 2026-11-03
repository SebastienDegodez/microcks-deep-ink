import type {
  DirectApiInput,
  ImportOptions,
  ImportPreview,
  ImportResult,
  ImportSource,
  Importer,
  ImporterDiff,
  RecentImport,
} from '@/domain/importing';
import { scanWindow } from '@/domain/importing';
import type { SecretSummary } from '@/domain/shared';
import { NotFoundError, ValidationError, type Unsubscribe } from '@/application/shared';
import type { ImportGateway, ImporterRepository, SecretRepository } from '@/application/ports/importing';
import type { Clock } from '@/application/ports/shared';

/** Imports the person did recently, newest first ("Recent imports" of the Import screen). */
export interface ImportHistory {
  recent(limit: number): Promise<RecentImport[]>;
}

export type ImportingPorts = {
  gateway: ImportGateway;
  importers: ImporterRepository;
  secrets: SecretRepository;
  history: ImportHistory;
  /** Defaults to the real time; the in-memory adapters pass the demo clock. */
  clock?: Clock;
};

/** The global scan schedule shown above the sources. */
export interface ScanSchedule {
  cron: string;
  envVar: string;
  description: string;
  lastScanAt: string;
  nextScanAt: string;
  minutesSinceLast: number;
  minutesUntilNext: number;
}

export interface ImportingUseCases {
  analyze(source: ImportSource): Promise<ImportPreview>;
  import(previewId: string, options: ImportOptions): Promise<ImportResult>;
  createDirectApi(input: DirectApiInput): Promise<ImportResult>;
  /** "Recent imports" of the Import screen. */
  recentImports(limit?: number): Promise<RecentImport[]>;

  listImporters(): Promise<Importer[]>;
  /** Throws `NotFoundError`. */
  getImporter(id: string): Promise<Importer>;
  /** Streams synchronisation progress (0..100); completing it records a new entry in the sync timeline. */
  runImporter(id: string, listener: (progress: number) => void): Unsubscribe;
  setImporterActive(id: string, active: boolean): Promise<Importer>;
  deleteImporter(id: string): Promise<void>;
  undoDeleteImporter(id: string): Promise<Importer>;
  getImporterDiff(id: string, fromVersion: string, toVersion: string): Promise<ImporterDiff>;
  /** Global scan schedule (hourly), with the demo clock. */
  getScanSchedule(): ScanSchedule;
  listSecrets(): Promise<SecretSummary[]>;
}

export function createImportingUseCases({ gateway, importers, secrets, history, clock }: ImportingPorts): ImportingUseCases {
  return {
    analyze: async (source) => {
      if (source.kind === 'file' && source.files.length === 0) throw new ValidationError('Choose at least one file.');
      if (source.kind === 'url' && !source.url.trim()) throw new ValidationError('Enter the URL of the artifact.');
      return gateway.analyze(source);
    },
    import: (previewId, options) => gateway.import(previewId, options),
    createDirectApi: (input) => gateway.createDirectApi(input),
    recentImports: (limit = 3) => history.recent(limit),
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
    getScanSchedule: () => {
      const window = scanWindow((clock ?? { now: () => new Date() }).now());
      return {
        cron: '0 0 * * * *',
        envVar: 'SERVICES_UPDATE_INTERVAL',
        description: 'every hour, global to all scheduled sources',
        lastScanAt: window.last.toISOString(),
        nextScanAt: window.next.toISOString(),
        minutesSinceLast: window.minutesSince,
        minutesUntilNext: window.minutesUntil,
      };
    },
    listSecrets: () => secrets.list(),
  };
}
