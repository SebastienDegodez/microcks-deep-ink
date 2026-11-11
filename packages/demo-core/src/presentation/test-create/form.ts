import type { ServiceSummary } from '../../domain/shared/index.js';
import {
  buildCiSnippet,
  CI_FORMATS,
  diffCiLines,
  parseTimeout,
  validateTestForm,
  type CiFormat,
  type CiLine,
  type CreateTestInput,
  type TestFormErrors,
  type TestTarget,
} from '../../domain/testing/index.js';
import { recommendedRunner, type Draft, type HeaderRow } from './draft.js';

/** Operations ticked in the draft: every operation of the target until the selection changes. */
export const selectedOperations = (target: TestTarget, d: Draft): string[] => d.ops ?? target.operations.map((o) => o.id);

/** Every operation of the target is ticked. */
export const allOperationsSelected = (target: TestTarget, selected: string[]) => selected.length === target.operations.length;

/** Validation errors of the draft, per field. */
export const draftErrors = (target: TestTarget, d: Draft, selected: string[]): TestFormErrors =>
  validateTestForm(target.type, {
    endpoint: d.endpoint,
    timeout: d.timeout,
    selectedOperations: selected,
    oauth: d.oauth,
    clientSecret: d.clientSecret,
  });

/** Why the Launch button is blocked, or `undefined` when the draft can be launched. */
export function launchBlockReason(errors: TestFormErrors): string | undefined {
  // Same order and wording as the prototype's blocked Launch button.
  return errors.endpoint ?? (errors.operations ? 'Select at least one operation.' : undefined) ?? (errors.timeout ? 'Fix the timeout.' : undefined) ?? (errors.clientSecret ? 'OAuth2 client secret is required.' : undefined);
}

/** Seconds the test waits for its results: the valid timeout, else 10 s. */
export const waitSeconds = (timeout: string) => Math.round((parseTimeout(timeout) ?? 10_000) / 1000);

/** "API Pastry 2.0": name and version of the service, or the fallback without a service. */
export const serviceLabelOf = (service: ServiceSummary | undefined, fallback = '') => (service ? `${service.name} ${service.version}`.trim() : fallback);

/** Lines of the CI snippet of the draft, marked when they differ from the default configuration of the target. */
export function ciLines(service: ServiceSummary | undefined, target: TestTarget, d: Draft, selected: string[], format: CiFormat): CiLine[] {
  const ciInput = {
    apiRef: `${service?.name ?? ''}:${service?.version ?? ''}`,
    apiName: service?.name ?? '',
    endpoint: d.endpoint,
    runner: d.runner,
    waitSec: waitSeconds(d.timeout),
    secret: d.secret,
    allOperations: allOperationsSelected(target, selected),
    selectedOperations: target.operations.filter((o) => selected.includes(o.id)).map((o) => o.name),
    headers: d.headers.map(({ scope, name, values }) => ({ scope, name, values })),
    isEvent: target.type === 'EVENT',
  };
  const defaultInput = {
    ...ciInput,
    endpoint: target.endpoint,
    runner: recommendedRunner(target),
    waitSec: 10,
    secret: '',
    allOperations: true,
    headers: [],
  };
  return diffCiLines(buildCiSnippet(ciInput, format), buildCiSnippet(defaultInput, format));
}

/** Input of the test launch for the draft: trimmed endpoint, valid timeout, named headers only. */
export const createTestInput = (target: TestTarget, d: Draft, selected: string[]): CreateTestInput => ({
  serviceId: target.serviceId,
  endpoint: d.endpoint.trim(),
  runner: d.runner,
  timeoutMs: parseTimeout(d.timeout) ?? 10_000,
  secretName: d.secret || undefined,
  operations: selected,
  headers: d.headers.filter((h) => h.name.trim()).map((h) => ({ name: h.name.trim(), value: h.values })),
});

/** Tone of the "last test" badge of the target. */
export const lastTestStatus = (lastTest: TestTarget['lastTest']): 'neutral' | 'success' | 'danger' => (lastTest.ok === null ? 'neutral' : lastTest.ok ? 'success' : 'danger');

/** Number of samples of the target's operations. */
export const sampleCount = (target: TestTarget) => target.operations.reduce((n, o) => n + o.samples, 0);

/** Number of operations of a service in the service picker, 0 without a target. */
export const targetOperationCount = (targets: TestTarget[], serviceId: string) => targets.find((t) => t.serviceId === serviceId)?.operations.length ?? 0;

/** Label of the operations group: "Operations · 2 of 3", or the single operation of an event API. */
export const operationsLabel = (target: TestTarget, selected: string[]) =>
  target.type === 'EVENT' ? 'Operation to listen to' : `Operations · ${selected.length} of ${target.operations.length}`;

/** Draft patch of "Clear all" / "Select all". */
export const toggleAllOperations = (target: TestTarget, selected: string[]): Pick<Draft, 'ops'> => ({
  ops: allOperationsSelected(target, selected) ? [] : target.operations.map((o) => o.id),
});

/** Draft patch that ticks or unticks one operation. */
export const checkOperation = (selected: string[], id: string, checked: boolean): Pick<Draft, 'ops'> => ({
  ops: checked ? [...selected, id] : selected.filter((x) => x !== id),
});

/** Draft patch that appends an empty header row, for all operations. */
export const addHeader = (d: Draft): Pick<Draft, 'headers' | 'nextId'> => ({
  headers: [...d.headers, { id: d.nextId, scope: 'globals', name: '', values: '' }],
  nextId: d.nextId + 1,
});

/** Draft patch of the "+ x-api-key (globals)" shortcut. */
export const addApiKeyHeader = (d: Draft): Pick<Draft, 'headers' | 'nextId'> => ({
  headers: [{ id: d.nextId, scope: 'globals', name: 'x-api-key', values: 'staging-4f2a9c' }],
  nextId: d.nextId + 1,
});

/** Draft patch that removes one header row. */
export const removeHeader = (d: Draft, id: number): Pick<Draft, 'headers'> => ({ headers: d.headers.filter((x) => x.id !== id) });

/** Draft patch that changes one header row. */
export const patchHeader = (d: Draft, id: number, patch: Partial<HeaderRow>): Pick<Draft, 'headers'> => ({
  headers: d.headers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
});

/** Tabs of the CI code block, one per format. */
export const CI_TABS = CI_FORMATS.map((f) => ({ id: f.id, label: f.label }));

/** Lines of the CI code block: an empty line keeps its height with a space. */
export const codeLines = (lines: CiLine[]) => lines.map((l) => ({ text: l.text || ' ', changed: l.changed }));

/** Number of CI lines that differ from the default configuration. */
export const changedLineCount = (lines: CiLine[]) => lines.filter((l) => l.changed).length;
