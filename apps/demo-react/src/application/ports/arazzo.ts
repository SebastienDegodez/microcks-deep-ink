import type {
  ArazzoDocument,
  ImportIssue,
  Session,
  RunOrigin,
  RunOptions,
  RunTarget,
  Workflow,
  WorkflowExample,
  WorkflowRun,
} from '@/domain/arazzo';
import type { Subscribe } from '@/application/shared';

export interface ArazzoRepository {
  documents(): Promise<ArazzoDocument[]>;
  document(id: string): Promise<ArazzoDocument | undefined>;
  workflows(documentId?: string): Promise<Workflow[]>;
  workflow(documentId: string, workflowId: string): Promise<Workflow | undefined>;
  /** Links a source description to an API of the catalogue. Returns the updated document. */
  linkSource(documentId: string, sourceName: string, serviceId: string): Promise<ArazzoDocument>;
  /** Re-validates the document against the POC subset. */
  validate(documentId: string): Promise<ImportIssue[]>;
  /** Raw YAML of the document (Source tab). */
  source(documentId: string): Promise<string>;
  examples(documentId: string, workflowId: string): Promise<WorkflowExample[]>;
}

export interface RunFilter {
  documentId?: string;
  workflowId?: string;
  origin?: RunOrigin['kind'];
}

export interface WorkflowRunRepository {
  list(filter?: RunFilter): Promise<WorkflowRun[]>;
  get(runId: string): Promise<WorkflowRun | undefined>;
  save(run: WorkflowRun): Promise<void>;
}

export interface StartRunRequest {
  documentId: string;
  workflowId: string;
  target: RunTarget;
  origin: RunOrigin;
  options: RunOptions;
}

export interface WorkflowRunner {
  /** Starts a run and returns its id. */
  start(request: StartRunRequest): Promise<string>;
  /** Streams the run while it executes (tick 1200 ms); the last emission has a final status. */
  watch(runId: string): Subscribe<WorkflowRun>;
}

export interface SessionRepository {
  list(documentId: string, workflowId: string): Promise<Session[]>;
  get(sessionId: string): Promise<Session | undefined>;
  open(input: {
    documentId: string;
    workflowId: string;
    app: string;
    inputs: Record<string, unknown>;
    failureInjection?: { stepId: string; example: string };
  }): Promise<Session>;
  /** Verifies the calls of a session; creates a run with the origin "session". */
  verify(sessionId: string): Promise<Session>;
}
