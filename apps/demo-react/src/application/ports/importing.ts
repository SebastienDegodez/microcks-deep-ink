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
import type { Subscribe } from '@/application/shared';

export interface ImportGateway {
  analyze(source: ImportSource): Promise<ImportPreview>;
  import(previewId: string, options: ImportOptions): Promise<ImportResult>;
  createDirectApi(input: DirectApiInput): Promise<ImportResult>;
}

export interface ImporterRepository {
  list(): Promise<Importer[]>;
  get(id: string): Promise<Importer | undefined>;
  setActive(id: string, active: boolean): Promise<Importer>;
  remove(id: string): Promise<void>;
  /** Restores a removed importer (Undo). */
  restore(id: string): Promise<Importer>;
  /** Runs a synchronisation; the stream emits progress 0..100 and completes at 100. */
  run(id: string): Subscribe<number>;
  diff(id: string, fromVersion: string, toVersion: string): Promise<ImporterDiff>;
}

export interface SecretInput {
  name: string;
  kind: SecretSummary['kind'];
  description?: string;
  value: string;
  /** Credential summary without the value ("header PRIVATE-TOKEN · token ••••••••"). */
  detail?: string;
}

export interface SecretRepository {
  list(): Promise<SecretSummary[]>;
  create(input: SecretInput): Promise<SecretSummary>;
  /** Changes the type, description or credentials; the name never changes. An empty `value` keeps the stored one. */
  update(id: string, input: Omit<SecretInput, 'name'>): Promise<SecretSummary>;
  remove(id: string): Promise<void>;
}
