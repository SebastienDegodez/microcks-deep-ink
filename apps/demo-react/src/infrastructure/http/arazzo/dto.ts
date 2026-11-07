/**
 * Wire types of the Arazzo API: proposition v2 / not in Microcks API.
 *
 * Arazzo workflows are not part of Microcks API v1.x. Paths and request bodies follow the POC of the maintainer's
 * fork (https://github.com/SebastienDegodez/microcks/tree/feature/arazzo, `webapp/src/main/java/io/github/microcks/web/
 * Arazzo*Controller.java`): `ArazzoRunLaunchDTO`, `ArazzoSessionRequest` and `ArazzoLinksRequest` are mirrored below.
 * Responses carry the demo's payloads (documents, workflows, runs and sessions as the pages show them); fields the POC
 * does not send are optional and the mapping (`./mapping.ts`) fills them.
 */
import type {
  ArazzoDocument,
  ImportIssue,
  RunOrigin,
  RunTarget,
  Session,
  Workflow,
  WorkflowExample,
  WorkflowRun,
} from '@/domain/arazzo';

/** `GET /api/arazzo/documents`: one document (the POC's `ArazzoDocumentSummary` + the demo fields). */
export type ArazzoDocumentDto = Omit<ArazzoDocument, 'apiId' | 'file' | 'origin' | 'sources' | 'workflowIds' | 'importIssues'> &
  Partial<Pick<ArazzoDocument, 'apiId' | 'file' | 'origin' | 'sources' | 'workflowIds' | 'importIssues'>> & {
    /** POC name of `file`. */
    fileName?: string;
    /** POC summaries list the workflows themselves. */
    workflows?: { workflowId: string }[];
  };

/** `GET /api/arazzo/documents/{documentId}/workflows/{workflowId}` (the POC's `ArazzoWorkflowDetail` + the demo fields). */
export type ArazzoWorkflowDto = Omit<Workflow, 'mockUrl' | 'runnability' | 'inputs' | 'steps' | 'outputs'> &
  Partial<Pick<Workflow, 'mockUrl' | 'runnability' | 'inputs' | 'steps' | 'outputs'>>;

/** A run (`GET /api/arazzo/runs/{runId}`, the POC's `WorkflowResult` + the demo fields). */
export type ArazzoRunDto = Omit<WorkflowRun, 'steps' | 'outputs' | 'coherence'> & Partial<Pick<WorkflowRun, 'steps' | 'outputs' | 'coherence'>>;

/** One frame of a run in progress (`GET /api/arazzo/runs/{runId}/progress?after=<seq>&limit=<n>`), oldest first. */
export interface ArazzoRunFrameDto {
  /** Position of the frame in the run, from 0. */
  seq: number;
  run: ArazzoRunDto;
}

/**
 * `POST /api/arazzo/documents/{documentId}/workflows/{workflowId}/runs`: the POC's `ArazzoRunLaunchDTO`
 * (`implementations` absent for the mocks) + `origin` and the proposed `mixed` target.
 */
export interface ArazzoRunLaunchDto {
  inputs: Record<string, unknown>;
  /** Milliseconds. */
  timeout?: number;
  /** Base URL of each source's implementation, by source name; absent to run on the mocks. */
  implementations?: Record<string, string>;
  secretName?: string;
  validateSchema?: boolean;
  example?: string;
  /** Demo extension: who started the run (the POC derives it from the endpoint). */
  origin?: RunOrigin;
  /** Demo extension: the proposed `mixed` target only. */
  target?: Extract<RunTarget, { kind: 'mixed' }>;
}

/** `PUT /api/arazzo/documents/{documentId}/sources`: the POC's `ArazzoLinksRequest` (`ServiceRef` by source name). */
export interface ArazzoLinksRequestDto {
  links: Record<string, { serviceId: string; name?: string; version?: string }>;
}

/** `POST /api/arazzo/documents/{documentId}/analysis`: the POC's `ArazzoImportAnalysis`, only what the demo reads. */
export interface ArazzoImportAnalysisDto {
  refusal?: string | null;
  /** Demo extension: the features refused at import. */
  importIssues?: ImportIssue[];
}

/** `POST /api/arazzo/sessions`: the POC's `ArazzoSessionRequest` (`failures`: example by step id) + `app`. */
export interface ArazzoSessionRequestDto {
  documentId: string;
  workflowId: string;
  inputs: Record<string, unknown>;
  failures?: Record<string, string>;
  /** Demo extension: the application that calls the mocks. */
  app?: string;
}

export type ArazzoSessionDto = Omit<Session, 'calls'> & Partial<Pick<Session, 'calls'>>;

/** `GET /api/arazzo/documents/{documentId}/workflows/{workflowId}/examples`: the recorded examples of the overlay. */
export type ArazzoWorkflowExampleDto = WorkflowExample;
