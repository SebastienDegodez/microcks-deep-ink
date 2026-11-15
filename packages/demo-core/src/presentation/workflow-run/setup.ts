import type { Step, Workflow, WorkflowExample, WorkflowInput } from '../../domain/arazzo/index.js';
import type { RunApiBody } from './api.js';

/** What the steps of a run call. */
export type RunTargetKind = 'mocks' | 'implementations' | 'mixed';

/** One choice of "Run against". */
export interface RunTargetChoice {
  value: RunTargetKind;
  label: string;
  proposed?: boolean;
  description: string;
}

/** The choices of "Run against": the mocks, the implementations, or each source on its own (proposed). */
export const RUN_TARGETS: readonly RunTargetChoice[] = [
  { value: 'mocks', label: 'Microcks mocks', description: 'Each step calls the mocks of its linked API, for example /rest/API+Pastry/2.0. Checks that the mock examples form a coherent scenario.' },
  { value: 'implementations', label: 'Implementations', description: 'Each step calls the base URL you set per source description. Checks the real services against the workflow.' },
  { value: 'mixed', label: 'Mixed', proposed: true, description: 'Per source description: its mocks or its implementation URL.' },
];

/** Label of a target choice. */
export const runTargetLabel = (target: RunTargetKind) => RUN_TARGETS.find((t) => t.value === target)?.label ?? '';

/** The source descriptions a workflow calls, in step order. */
export const workflowSources = (workflow: Workflow) => [...new Set(workflow.steps.map((s) => s.sourceName))];

/** The inputs an example fills, as the form edits them. */
export function exampleInputs(example: Pick<WorkflowExample, 'inputs'>): Record<string, string> {
  return Object.fromEntries(Object.entries(example.inputs).map(([k, v]) => [k, String(v)]));
}

/** The values a `size` input takes. */
export const SIZE_OPTIONS = ['S', 'M', 'L'] as const;

/** Type shown next to an input name: "string · S | M | L" for `size`, else its schema type. */
export const inputTypeLabel = (input: Pick<WorkflowInput, 'name' | 'type'>) => (input.name === 'size' ? 'string · S | M | L' : input.type);

/** Where an input goes: a parameter of a step ("Query parameter size of listPastries") or a body field. */
export type InputHelp = { kind: 'parameter'; where: string; name: string; stepId: string } | { kind: 'body'; text: string };

/** Where an input of the workflow goes, from the first step that uses it. */
export function inputHelp(workflow: Workflow, name: string): InputHelp | undefined {
  const p = workflow.steps.flatMap((st) => st.parameters.filter((x) => x.value === `$inputs.${name}`).map((x) => ({ st, x })))[0];
  if (p) return { kind: 'parameter', where: p.x.in === 'query' ? 'Query parameter' : p.x.in === 'path' ? 'Path parameter' : 'Header', name: p.x.name, stepId: p.st.stepId };
  const b = workflow.steps.find((st) => st.requestBody?.includes(`{$inputs.${name}}`));
  const key = b?.requestBody?.match(new RegExp(`"([^"]+)"\\s*:\\s*"\\{\\$inputs\\.${name}\\}"`))?.[1];
  return b ? { kind: 'body', text: `Body /${key ?? name} of ${b.stepId}` } : undefined;
}

/** "restock-pastry · example impl14 against implementations", next to the Run button. */
export function launchHint(workflowId: string, example: string, target: RunTargetKind): string {
  return `${workflowId} · ${example ? `example ${example}` : 'own inputs'} against ${target === 'mocks' ? 'the mocks' : target === 'implementations' ? 'implementations' : 'mixed targets'}`;
}

/** The inputs of the API body: filled ones only, numbers as numbers. */
export function apiInputs(workflow: Workflow, inputs: Record<string, string>): Record<string, unknown> {
  return Object.fromEntries(workflow.inputs.flatMap((i) => (inputs[i.name] ? [[i.name, i.type === 'number' || i.type === 'integer' ? Number(inputs[i.name]) : inputs[i.name]]] : [])));
}

/** The form state the API body of the setup page is built from. */
export interface SetupBodyState {
  workflow: Workflow;
  inputs: Record<string, string>;
  timeoutMs: number;
  target: RunTargetKind;
  baseUrls: Record<string, string>;
  perSource: Record<string, 'mock' | 'implementation'>;
  secret: string | undefined;
  validate: boolean;
  example: string;
}

/** The `POST …/runs` body that launches the run the form describes. */
export function setupApiBody(s: SetupBodyState): RunApiBody {
  return {
    inputs: apiInputs(s.workflow, s.inputs),
    timeout: s.timeoutMs,
    ...(s.target !== 'mocks'
      ? { implementations: s.target === 'implementations' ? s.baseUrls : Object.fromEntries(Object.entries(s.baseUrls).filter(([k]) => (s.perSource[k] ?? 'mock') === 'implementation')) }
      : {}),
    ...(s.secret ? { secretName: s.secret } : {}),
    validateSchema: s.validate,
    ...(s.example ? { example: s.example } : {}),
  };
}

/** The onSuccess and onFailure actions of a step, in words, for "What runs". */
export function planActions(step: Pick<Step, 'onSuccess' | 'onFailure'>): string[] {
  return [
    ...step.onSuccess.map((a) => (a.type === 'end' ? `onSuccess end${a.criteria?.length ? ` when ${a.criteria.map((c) => c.condition).join(' and ')}` : ''}` : '')),
    ...step.onFailure.map((a) => (a.type === 'retry' ? `onFailure retry · retryAfter ${a.retryAfter} · retryLimit ${a.retryLimit}` : `onFailure end`)),
  ].filter(Boolean);
}

/** The overlay file the examples are recorded in: `pastry.arazzo-sources.yaml`. */
export const examplesFile = (file: string) => file.replace(/\.arazzo\.yaml$/, '.arazzo-sources.yaml');

/** One fact of "Expected by <example>". */
export interface ExpectedFact {
  term: string;
  mono?: boolean;
  value: string;
}

/** What an example expects: its outputs, the status of each step and where it ends. */
export function expectedFacts(example: WorkflowExample): ExpectedFact[] {
  return [
    ...(Object.keys(example.outputs).length > 0
      ? [{ term: 'Outputs', mono: true, value: Object.entries(example.outputs).map(([k, v]) => `${k} = ${String(v)}`).join(' · ') }]
      : []),
    { term: 'Steps', mono: true, value: example.steps.map((st) => `${st.stepId} ${st.status}`).join(' ') },
    { term: 'End', value: example.stopsAt ? `Stops at ${example.stopsAt}` : 'Runs to its end' },
  ];
}

/** Title of the error summary: "1 problem to fix before running", "2 problems…". */
export const problemsTitle = (n: number) => (n === 1 ? '1 problem to fix before running' : `${n} problems to fix before running`);

/** Help of the base URL of a source: the operation paths of its API are appended. */
export const baseUrlHelp = (api: string) => `Absolute http(s) URL; the operation paths of ${api} are appended.`;
