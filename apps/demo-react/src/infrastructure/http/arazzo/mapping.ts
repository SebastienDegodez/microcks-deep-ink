/**
 * Arazzo wire types (`./dto.ts`) <-> domain. Pure functions, shared by the HTTP adapters (reading) and the MSW
 * handlers (serving). Reading never requires a demo extension: what the POC does not send gets a default.
 */
import {
  DEFAULT_RUN_TIMEOUT_MS,
  type Action,
  type ArazzoDocument,
  type Criterion,
  type NamedExpression,
  type Runnability,
  type RunStatus,
  type SourceDescription,
  type Step,
  type StepParameter,
  type StepResult,
  type StepStatus,
  type WorkflowInput,
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
  DemoRunDto,
  PocDate,
  PocRunStatus,
  PocSourceSummary,
  PocStepAction,
  PocStepCriterion,
  PocStepDetail,
  PocStepResult,
  PocWorkflowDetail,
  PocWorkflowResult,
  PocWorkflowRunSummary,
  PocWorkflowStatus,
} from './dto';
import { fromServiceType } from '@/infrastructure/http/catalog/mapping';

type OpenSessionInput = Parameters<SessionRepository['open']>[0];

const isPocSource = (s: SourceDescription | PocSourceSummary): s is PocSourceSummary => !('name' in s) && typeof s.link === 'object' && 'linked' in s.link;

/** POC `ArazzoSourceSummary` -> domain source (the POC gives no url nor operation count). */
export function fromPocSource(s: PocSourceSummary): SourceDescription {
  const protocol = s.apiType ? fromServiceType(s.apiType) : 'REST';
  return {
    name: s.link.sourceName,
    type: protocol === 'EVENT' ? 'asyncapi' : 'openapi',
    url: '',
    link: s.link.linked && s.apiId
      ? { status: 'linked', serviceId: s.apiId, protocol, operationsFound: '' }
      : { status: 'not-linked', expectedFile: s.link.apiName ? `${s.link.apiName}${s.link.apiVersion ? ` ${s.link.apiVersion}` : ''}` : '' },
  };
}

export function toDocument(dto: ArazzoDocumentDto): ArazzoDocument {
  const { fileName, workflows, sources, ...rest } = dto;
  return {
    ...rest,
    apiId: dto.apiId ?? dto.id,
    file: dto.file ?? fileName ?? '',
    origin: dto.origin ?? '',
    sources: (sources ?? []).map((s) => (isPocSource(s) ? fromPocSource(s) : s)),
    workflowIds: dto.workflowIds ?? (workflows ?? []).map((w) => w.workflowId ?? w.status?.workflowId).filter((id): id is string => !!id),
    importIssues: dto.importIssues ?? [],
  };
}

/** The POC mock URL of a workflow: `POST <microcks>/arazzo/<document title>/<document version>/<workflowId>`. */
export function workflowMockUrl(microcksBase: string, document: Pick<ArazzoDocument, 'title' | 'version'>, workflowId: string): string {
  const base = microcksBase.replace(/\/+$/, '');
  return `${base}/arazzo/${encodeURIComponent(document.title)}/${encodeURIComponent(document.version)}/${encodeURIComponent(workflowId)}`;
}

/** `Map<String, String>` (POC) or the demo list -> named expressions. */
function toNamed(value: NamedExpression[] | Record<string, string> | null | undefined): NamedExpression[] {
  if (!value) return [];
  return Array.isArray(value) ? value : Object.entries(value).map(([name, expression]) => ({ name, expression }));
}

function toCriterion(c: PocStepCriterion | Criterion): Criterion {
  if (c.type === 'regex') return { type: 'regex', context: c.context ?? '', condition: c.condition };
  return { type: 'simple', condition: c.condition };
}

function toAction(a: PocStepAction | Action): Action {
  const criteria = a.criteria ? a.criteria.map(toCriterion) : undefined;
  if (a.type === 'retry') {
    return { type: 'retry', name: a.name, retryAfter: a.retryAfter ?? 0, retryLimit: a.retryLimit ?? 1, ...(criteria ? { criteria } : {}) };
  }
  // The POC subset only allows `retry` and `end`.
  return { type: 'end', name: a.name, ...(criteria ? { criteria } : {}) };
}

const PARAMETER_PLACES: readonly StepParameter['in'][] = ['path', 'query', 'header'];
const INPUT_TYPES: readonly WorkflowInput['type'][] = ['string', 'number', 'integer', 'boolean'];

/** POC `ArazzoStepDetail` (or a demo step) -> domain step. */
export function toStep(step: PocStepDetail | Step): Step {
  if ('sourceName' in step && !('operation' in step)) return step;
  const poc = step as PocStepDetail;
  const op = poc.operation ?? {};
  return {
    stepId: poc.stepId,
    sourceName: op.sourceName ?? '',
    operationId: op.operationId ?? '',
    method: op.method ?? '',
    path: op.path ?? op.channel ?? '',
    description: poc.description ?? '',
    parameters: (poc.parameters ?? []).map((p) => ({ name: p.name, in: PARAMETER_PLACES.find((i) => i === p.in) ?? 'query', value: p.value })),
    ...(poc.requestBody?.payload ? { requestBody: poc.requestBody.payload } : {}),
    successCriteria: (poc.successCriteria ?? []).map(toCriterion),
    onSuccess: (poc.onSuccess ?? []).map(toAction),
    onFailure: (poc.onFailure ?? []).map(toAction),
    outputs: toNamed(poc.outputs),
    ...(poc.dependsOn?.length ? { dependsOn: poc.dependsOn } : {}),
  };
}

function fromPocStatus(status: PocWorkflowStatus | null | undefined): Runnability {
  if (!status || status.runnable) return { runnable: true };
  const message = (status.reasons ?? []).join(' ') || `Workflow ${status.workflowId} cannot run`;
  return { runnable: false, reason: /async/i.test(message) ? 'asyncapi-steps' : 'source-not-linked', message };
}

/**
 * The demo workflow, or the POC's `ArazzoWorkflowDetail` (outputs as a map, steps with an `operation`, runnability in
 * `status`). `document` and `microcksBase` give the mock URL when the answer has none.
 */
export function toWorkflow(dto: ArazzoWorkflowDto, document: Pick<ArazzoDocument, 'title' | 'version'> | undefined, microcksBase: string): Workflow {
  const any = dto as Partial<Workflow> & Partial<PocWorkflowDetail> & Pick<Workflow, 'workflowId' | 'documentId'>;
  const owner = document ?? (any.title && any.version ? { title: any.title, version: any.version } : undefined);
  return {
    workflowId: any.workflowId,
    documentId: any.documentId,
    summary: any.summary ?? '',
    ...(any.description ? { description: any.description } : {}),
    inputs: (any.inputs ?? []).map((i) => ({
      name: i.name,
      type: INPUT_TYPES.find((t) => t === i.type) ?? 'string',
      ...('example' in i && i.example !== undefined ? { example: i.example } : {}),
    })),
    steps: (any.steps ?? []).map(toStep),
    outputs: toNamed(any.outputs),
    mockUrl: any.mockUrl ?? (owner ? workflowMockUrl(microcksBase, owner, any.workflowId) : ''),
    runnability: any.runnability ?? fromPocStatus(any.status),
  };
}

const isDemoRun = (dto: ArazzoRunDto): dto is DemoRunDto => 'options' in dto && !!dto.options;

/** Jackson `Date`: epoch milliseconds or ISO-8601. */
export function fromPocDate(date: PocDate | null | undefined): string {
  if (date === null || date === undefined || date === '') return '';
  return new Date(date).toISOString();
}

const RUN_STATUS: Record<PocRunStatus, RunStatus> = { IN_PROGRESS: 'RUNNING', SUCCESS: 'SUCCESS', FAILURE: 'FAILURE' };
const STEP_STATUS: Record<PocStepResult['status'], StepStatus> = { PASSED: 'passed', FAILED: 'failed', NOT_RUN: 'not-run' };

function fromPocStep(step: PocStepResult, startedAt: string): StepResult {
  const status = STEP_STATUS[step.status] ?? 'not-run';
  const params: Record<string, string> = {};
  for (const p of step.parameters ?? []) params[p.name] = p.value === undefined || p.value === null ? '' : String(p.value);
  return {
    stepId: step.stepId,
    status,
    attempts: step.statusCode ? [{ n: 1, httpStatus: step.statusCode, ms: step.elapsedTime ?? 0, when: startedAt }] : [],
    ...(step.requestUrl ? { request: { method: step.operation?.method ?? '', url: step.requestUrl, params } } : {}),
    criteria: (step.criteria ?? []).map((c) => ({ condition: c.condition, kind: 'simple', evaluation: c.held ? 'held' : 'did not hold', held: c.held })),
    schema: { state: 'na', ref: '', message: '' },
    outputs: step.outputs ?? {},
    flow: status === 'failed' ? { kind: 'stop', title: step.message ?? 'Step failed', text: step.message ?? '' } : { kind: 'next', title: '', text: step.message ?? '' },
    baggage: '',
  };
}

/**
 * The demo run, or a POC `WorkflowResult` / `WorkflowRunSummary`: status and origin enums, `startedDate`, top-level
 * `inputs`/`timeout`/`validateSchema` (no `options`), a target enum with per-source base URLs. A summary has no document
 * id nor steps: `context.documentId` (the path of the history) gives the document.
 */
export function toRun(dto: ArazzoRunDto, context: { documentId?: string } = {}): WorkflowRun {
  if (isDemoRun(dto)) return { ...dto, steps: dto.steps ?? [], outputs: dto.outputs ?? {}, coherence: dto.coherence ?? [] };
  const poc = dto as Partial<PocWorkflowResult> & PocWorkflowRunSummary;
  const startedAt = fromPocDate(poc.startedDate);
  const exampleName = typeof poc.example === 'string' ? poc.example : (poc.example as { name?: string } | null | undefined)?.name;
  const session = (dto as PocWorkflowResult).session;
  const origin: RunOrigin =
    poc.origin === 'MOCK_URL' ? { kind: 'mock-url' } : poc.origin === 'SESSION' ? { kind: 'session', sessionId: session?.sessionId ?? '', app: '' } : { kind: 'api' };
  const baseUrls: Record<string, string> = {};
  for (const s of poc.sources ?? []) if (s.baseUrl) baseUrls[s.sourceName] = s.baseUrl;
  const target: RunTarget = poc.target === 'IMPLEMENTATIONS' ? { kind: 'implementations', baseUrls } : { kind: 'mocks' };
  const options: RunOptions = { inputs: poc.inputs ?? {}, timeoutMs: poc.timeout ?? DEFAULT_RUN_TIMEOUT_MS, validateSchemas: poc.validateSchema === true };
  if (exampleName) options.example = exampleName;
  if (poc.secretRef?.name) options.secret = poc.secretRef.name;
  return {
    id: poc.id,
    number: poc.number ?? 0,
    documentId: poc.documentId ?? context.documentId ?? '',
    workflowId: poc.workflowId,
    origin,
    target,
    options,
    status: RUN_STATUS[poc.status] ?? 'FAILURE',
    startedAt,
    steps: (poc.steps ?? []).map((s) => fromPocStep(s, startedAt)),
    outputs: poc.outputs ?? {},
    coherence: [],
  };
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

/**
 * Body of the POC `PUT .../sources`, which REPLACES the links (an omitted source is unlinked): every source linked now,
 * with `sourceName` linked to `serviceId`.
 */
export function toLinksRequest(document: Pick<ArazzoDocument, 'sources'>, sourceName: string, serviceId: string): ArazzoLinksRequestDto {
  const links: ArazzoLinksRequestDto['links'] = {};
  for (const s of document.sources) if (s.link.status === 'linked') links[s.name] = { serviceId: s.link.serviceId };
  links[sourceName] = { serviceId };
  return { links };
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
