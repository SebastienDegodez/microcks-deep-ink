import { callsImplementation, launchTargetFields, type RunTarget } from '../../domain/arazzo/index.js';

/* Pieces shared by the run setup page and the run page (the prototype is one page in two phases). */

/** One crumb of the run pages' breadcrumb; the current page has no route. */
export interface RunCrumb {
  label: string;
  to?: string;
}

/** Breadcrumb of both pages: Workflows › Pastry workflows - 1.2.0 › Runs › <current>. */
export function runBreadcrumb(documentLabel: string | undefined, workflowTo: string, runsTo: string, current: string): RunCrumb[] {
  return [
    { label: 'Workflows', to: '/workflows' },
    { label: documentLabel ?? 'Workflow', to: workflowTo },
    { label: 'Runs', to: runsTo },
    { label: current },
  ];
}

/** "apiPastry → https://pastry.staging.acme.io/v2" for the implementations of a run or a form. */
export function implementationsText(baseUrls: Record<string, string>): string {
  return Object.entries(baseUrls)
    .map(([source, url]) => `${source} → ${url}`)
    .join(' · ');
}

/** "customerApi → https://customers.staging.example · orderApi → its mocks": where each source of a mixed run goes. */
export function mixedSourcesText(target: Extract<RunTarget, { kind: 'mixed' }>): string {
  return Object.entries(target.perSource)
    .map(([source, where]) => `${source} → ${where === 'implementation' ? (target.baseUrls?.[source] ?? 'its implementation') : 'its mocks'}`)
    .join(' · ');
}

/** Body of `POST …/runs` as Microcks takes it. */
export interface RunApiBody {
  inputs: Record<string, unknown>;
  timeout: number;
  /** Base URL of each source sent to its implementation; a source left out goes to its mocks. */
  implementations?: Record<string, string>;
  /** Only for a mixed run: where each source goes. */
  target?: { kind: 'mixed'; perSource: Record<string, 'mock' | 'implementation'> };
  secretName?: string;
  validateSchema: boolean;
  example?: string;
}

/** The launch body of a run: the target as Microcks 2.0 takes it, and the secret only when an implementation is called. */
export function launchBody(
  target: RunTarget,
  rest: { inputs: Record<string, unknown>; timeout: number; secretName?: string; validateSchema: boolean; example?: string },
): RunApiBody {
  return {
    inputs: rest.inputs,
    timeout: rest.timeout,
    ...launchTargetFields(target),
    ...(callsImplementation(target) && rest.secretName ? { secretName: rest.secretName } : {}),
    validateSchema: rest.validateSchema,
    ...(rest.example ? { example: rest.example } : {}),
  };
}

/** The curl commands of "Run it from the API": pretty-printed to show, on one line to copy. */
export interface RunApiCommands {
  curl: string;
  curlOne: string;
  mockCurl: string;
  mockOne: string;
}

/** The curl that launches the same run, then the Mock URL curl that plays the workflow on its mocks. */
export function runApiCommands(documentApiId: string, workflowId: string, mockUrl: string, body: RunApiBody): RunApiCommands {
  const runsUrl = `http://microcks.local:8080/api/arazzo/documents/${documentApiId}/workflows/${workflowId}/runs`;
  const mockBody = JSON.stringify(body.inputs);
  return {
    curl: `curl -X POST \\\n  '${runsUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body, null, 2)}'`,
    curlOne: `curl -X POST '${runsUrl}' -H 'Content-Type: application/json' -d '${JSON.stringify(body)}'`,
    mockCurl: `curl -X POST \\\n  '${mockUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${mockBody}'`,
    mockOne: `curl -X POST '${mockUrl}' -H 'Content-Type: application/json' -d '${mockBody}'`,
  };
}

/** Glyph of a verdict: "✓ Passed", "✕ Failed", "– Off", a running arc or a dashed circle. */
export type VerdictIcon = 'check' | 'cross' | 'dash' | 'running' | 'circle';

/** Stroke of a verdict glyph: a dashed 2px circle, else a bold 2.6px stroke. */
export function verdictStroke(icon: VerdictIcon): { width: number; dash: string | undefined } {
  return { width: icon === 'circle' ? 2 : 2.6, dash: icon === 'circle' ? '3 3' : undefined };
}
