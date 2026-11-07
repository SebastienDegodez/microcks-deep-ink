/**
 * Wire types of the Arazzo API: proposition v2 / not in Microcks API.
 *
 * Arazzo workflows are not part of Microcks API v1.x. Paths and request bodies follow the POC of the maintainer's
 * fork (https://github.com/SebastienDegodez/microcks/tree/feature/arazzo, `webapp/src/main/java/io/github/microcks/web/
 * Arazzo*Controller.java`): `ArazzoRunLaunchDTO`, `ArazzoSessionRequest` and `ArazzoLinksRequest` are mirrored below.
 * Responses carry the demo's payloads (documents, workflows, runs and sessions as the pages show them) or the POC's own
 * records (`Poc*` below, from its `commons/model` at SHA 2e6dde48); the mapping (`./mapping.ts`) normalises both.
 */
import type {
  ArazzoDocument,
  ImportIssue,
  RunOrigin,
  RunTarget,
  Session,
  SourceDescription,
  Workflow,
  WorkflowExample,
  WorkflowRun,
} from '@/domain/arazzo';
import type { MicrocksServiceType } from '@/infrastructure/http/catalog/dto';

/** `GET /api/arazzo/documents`: the demo document, or the POC's `ArazzoDocumentSummary` (fields absent on one side optional). */
export type ArazzoDocumentDto = Omit<ArazzoDocument, 'apiId' | 'file' | 'origin' | 'sources' | 'workflowIds' | 'importIssues'> &
  Partial<Pick<ArazzoDocument, 'apiId' | 'file' | 'origin' | 'workflowIds' | 'importIssues'>> & {
    sources?: (SourceDescription | PocSourceSummary)[] | null;
    /** POC name of `file`. */
    fileName?: string | null;
    /** POC: `List<ArazzoWorkflowSummary>`, the workflow id in `status`. */
    workflows?: { workflowId?: string; status?: PocWorkflowStatus | null }[] | null;
  };

/** POC `ArazzoSourceLink`. */
export interface PocSourceLink {
  sourceName: string;
  apiName?: string | null;
  apiVersion?: string | null;
  linked: boolean;
}

/** POC `ArazzoSourceSummary` (`apiType`: a Microcks `ServiceType`). */
export interface PocSourceSummary {
  link: PocSourceLink;
  apiId?: string | null;
  apiType?: MicrocksServiceType | null;
}

/** POC `ArazzoWorkflowStatus`. */
export interface PocWorkflowStatus {
  workflowId: string;
  runnable: boolean;
  reasons?: string[] | null;
}

/** POC `ArazzoStepCriterion`. */
export interface PocStepCriterion {
  condition: string;
  context?: string | null;
  type?: string | null;
}

/** POC `ArazzoStepAction`. */
export interface PocStepAction {
  name: string;
  type: string;
  retryAfter?: number | null;
  retryLimit?: number | null;
  criteria?: PocStepCriterion[] | null;
}

/** POC `ArazzoStepDetail` (outputs: expression by name). */
export interface PocStepDetail {
  stepId: string;
  description?: string | null;
  operation?: { sourceName?: string | null; operationId?: string | null; method?: string | null; path?: string | null; channel?: string | null } | null;
  parameters?: { name: string; in: string; value: string }[] | null;
  requestBody?: { contentType?: string | null; payload?: string | null } | null;
  successCriteria?: PocStepCriterion[] | null;
  outputs?: Record<string, string> | null;
  onSuccess?: PocStepAction[] | null;
  onFailure?: PocStepAction[] | null;
  dependsOn?: string[] | null;
}

/** POC `ArazzoWorkflowDetail`: the workflow with its document (outputs: expression by name, runnability in `status`). */
export interface PocWorkflowDetail {
  documentId: string;
  title?: string | null;
  version?: string | null;
  workflowId: string;
  summary?: string | null;
  description?: string | null;
  inputs?: { name: string; type?: string | null; required?: boolean }[] | null;
  steps?: PocStepDetail[] | null;
  outputs?: Record<string, string> | null;
  status?: PocWorkflowStatus | null;
}

/** `GET /api/arazzo/documents/{documentId}/workflows/{workflowId}`: the demo workflow, or the POC's `ArazzoWorkflowDetail`. */
export type ArazzoWorkflowDto =
  | (Omit<Workflow, 'mockUrl' | 'runnability' | 'inputs' | 'steps' | 'outputs'> & Partial<Pick<Workflow, 'mockUrl' | 'runnability' | 'inputs' | 'steps' | 'outputs'>>)
  | PocWorkflowDetail;

export type PocRunTarget = 'MOCKS' | 'IMPLEMENTATIONS';
export type PocRunStatus = 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE';
/** Null for a run launched from the UI or the API. */
export type PocRunOrigin = 'MOCK_URL' | 'SESSION';
/** Jackson writes a `Date` as epoch milliseconds (default) or ISO-8601. */
export type PocDate = number | string;

/** POC `WorkflowStepResult`. */
export interface PocStepResult {
  index?: number;
  stepId: string;
  operation?: { sourceName?: string | null; operationId?: string | null; method?: string | null; path?: string | null } | null;
  status: 'PASSED' | 'FAILED' | 'NOT_RUN';
  statusCode?: number | null;
  elapsedTime?: number | null;
  criteria?: { condition: string; held: boolean }[] | null;
  outputs?: Record<string, unknown> | null;
  message?: string | null;
  requestUrl?: string | null;
  parameters?: { name: string; in?: string | null; value?: unknown; expression?: string | null }[] | null;
}

/** POC `WorkflowResult` (`GET /api/arazzo/runs/{runId}`, launches, verifications). */
export interface PocWorkflowResult {
  id: string;
  documentId?: string | null;
  workflowId: string;
  target?: PocRunTarget | null;
  sources?: { sourceName: string; baseUrl?: string | null }[] | null;
  inputs?: Record<string, unknown> | null;
  outputs?: Record<string, unknown> | null;
  status: PocRunStatus;
  startedDate?: PocDate | null;
  elapsedTime?: number;
  timeout?: number | null;
  secretRef?: { name?: string | null } | null;
  steps?: PocStepResult[] | null;
  message?: string | null;
  number?: number | null;
  validateSchema?: boolean;
  example?: { name: string } | null;
  origin?: PocRunOrigin | null;
  session?: { sessionId: string } | null;
}

/** POC `WorkflowRunSummary` (`GET /api/arazzo/documents/{documentId}/runs`): no document id, the path gives it. */
export interface PocWorkflowRunSummary {
  id: string;
  number?: number | null;
  workflowId: string;
  target?: PocRunTarget | null;
  status: PocRunStatus;
  failedStepId?: string | null;
  startedDate?: PocDate | null;
  elapsedTime?: number;
  example?: string | null;
  origin?: PocRunOrigin | null;
}

/** The demo run (`steps`, `outputs`, `coherence` optional). */
export type DemoRunDto = Omit<WorkflowRun, 'steps' | 'outputs' | 'coherence'> & Partial<Pick<WorkflowRun, 'steps' | 'outputs' | 'coherence'>>;

/** A run: the demo run, the POC's `WorkflowResult`, or (run history) its `WorkflowRunSummary`. */
export type ArazzoRunDto = DemoRunDto | PocWorkflowResult | PocWorkflowRunSummary;

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
