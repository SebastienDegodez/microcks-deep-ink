/**
 * Arazzo wire types (`./dto.ts`) <-> domain. Pure functions, shared by the HTTP adapters (reading) and the MSW
 * handlers (serving). Reading never requires a demo extension: what the POC does not send gets a default.
 */
import {
  DEFAULT_RUN_TIMEOUT_MS,
  type ArazzoDocument,
  type ImportIssue,
  type RunOrigin,
  type RunTarget,
  type RunOptions,
  type Session,
  type Workflow,
  type WorkflowRun,
} from '@/domain/arazzo';
import type { RunFilter, SessionRepository, StartRunRequest } from '@/application/ports/arazzo';
import type {
  ArazzoDocumentDto,
  ArazzoImportAnalysisDto,
  ArazzoLinksRequestDto,
  ArazzoRunDto,
  ArazzoRunLaunchDto,
  ArazzoSessionDto,
  ArazzoSessionRequestDto,
  ArazzoWorkflowDto,
} from './dto';

type OpenSessionInput = Parameters<SessionRepository['open']>[0];

export function toDocument(dto: ArazzoDocumentDto): ArazzoDocument {
  const { fileName, workflows, ...rest } = dto;
  return {
    ...rest,
    apiId: dto.apiId ?? dto.id,
    file: dto.file ?? fileName ?? '',
    origin: dto.origin ?? '',
    sources: dto.sources ?? [],
    workflowIds: dto.workflowIds ?? workflows?.map((w) => w.workflowId) ?? [],
    importIssues: dto.importIssues ?? [],
  };
}

/** The POC mock URL of a workflow: `POST <microcks>/arazzo/<document title>/<document version>/<workflowId>`. */
export function workflowMockUrl(microcksBase: string, document: Pick<ArazzoDocument, 'title' | 'version'>, workflowId: string): string {
  const base = microcksBase.replace(/\/+$/, '');
  return `${base}/arazzo/${encodeURIComponent(document.title)}/${encodeURIComponent(document.version)}/${encodeURIComponent(workflowId)}`;
}

/** `document` and `microcksBase` give the mock URL when the answer has none. */
export function toWorkflow(dto: ArazzoWorkflowDto, document: Pick<ArazzoDocument, 'title' | 'version'> | undefined, microcksBase: string): Workflow {
  return {
    ...dto,
    inputs: dto.inputs ?? [],
    steps: dto.steps ?? [],
    outputs: dto.outputs ?? [],
    mockUrl: dto.mockUrl ?? (document ? workflowMockUrl(microcksBase, document, dto.workflowId) : ''),
    runnability: dto.runnability ?? { runnable: true },
  };
}

export function toRun(dto: ArazzoRunDto): WorkflowRun {
  return { ...dto, steps: dto.steps ?? [], outputs: dto.outputs ?? {}, coherence: dto.coherence ?? [] };
}

export function toSession(dto: ArazzoSessionDto): Session {
  return { ...dto, calls: dto.calls ?? [] };
}

export function toImportIssues(dto: ArazzoImportAnalysisDto | undefined): ImportIssue[] {
  return dto?.importIssues ?? [];
}

export function toLaunch(request: StartRunRequest): ArazzoRunLaunchDto {
  const { target, origin, options } = request;
  return {
    inputs: options.inputs,
    timeout: options.timeoutMs,
    implementations: target.kind === 'implementations' ? target.baseUrls : undefined,
    secretName: options.secret,
    validateSchema: options.validateSchemas,
    example: options.example,
    origin,
    target: target.kind === 'mixed' ? target : undefined,
  };
}

/** A launch as the POC reads it: the mocks without `implementations`, an `api` origin by default. */
export function fromLaunch(dto: ArazzoRunLaunchDto): { target: RunTarget; origin: RunOrigin; options: RunOptions } {
  const target: RunTarget = dto.target ?? (dto.implementations ? { kind: 'implementations', baseUrls: dto.implementations } : { kind: 'mocks' });
  const options: RunOptions = {
    inputs: dto.inputs ?? {},
    timeoutMs: dto.timeout ?? DEFAULT_RUN_TIMEOUT_MS,
    validateSchemas: dto.validateSchema === true,
  };
  if (dto.example) options.example = dto.example;
  if (dto.secretName) options.secret = dto.secretName;
  return { target, origin: dto.origin ?? { kind: 'api' }, options };
}

export function toSessionRequest(input: OpenSessionInput): ArazzoSessionRequestDto {
  const { documentId, workflowId, inputs, app, failureInjection } = input;
  return { documentId, workflowId, inputs, app, failures: failureInjection ? { [failureInjection.stepId]: failureInjection.example } : undefined };
}

export function fromSessionRequest(dto: ArazzoSessionRequestDto): OpenSessionInput {
  const [failure] = Object.entries(dto.failures ?? {});
  return {
    documentId: dto.documentId,
    workflowId: dto.workflowId,
    app: dto.app ?? 'api',
    inputs: dto.inputs ?? {},
    ...(failure ? { failureInjection: { stepId: failure[0], example: failure[1] } } : {}),
  };
}

export function toLinksRequest(sourceName: string, serviceId: string): ArazzoLinksRequestDto {
  return { links: { [sourceName]: { serviceId } } };
}

/** Query of `GET /api/arazzo/documents/{documentId}/runs` (`workflow` as in the POC, `origin` a demo extension). */
export function toRunsQuery(filter: RunFilter): { workflow?: string; origin?: string } {
  return { workflow: filter.workflowId, origin: filter.origin };
}

/** The filter, applied again on the client: a backend may ignore `origin`. */
export function matchesRunFilter(run: WorkflowRun, filter: RunFilter): boolean {
  return (
    (!filter.documentId || run.documentId === filter.documentId) &&
    (!filter.workflowId || run.workflowId === filter.workflowId) &&
    (!filter.origin || run.origin.kind === filter.origin)
  );
}
