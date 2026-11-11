import { DEFAULT_RUN_TIMEOUT_MS } from './run.js';

export const EXAMPLE_BASE_URL = 'https://pastry.staging.acme.io/v2';

export interface RunRequestInput {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean';
  /** Raw text typed in the form. */
  value: string;
}

/** The raw state of the "Run a workflow" form (strings as typed). */
export interface RunRequestForm {
  workflowId: string;
  /** Set when the selected workflow cannot run: the form is then invalid. */
  notRunnableMessage?: string;
  target: 'mocks' | 'implementations' | 'mixed';
  /** Source descriptions used by the workflow (one base URL field each). */
  sources: string[];
  baseUrls: Record<string, string>;
  /** Mixed target only: which sources run on the implementation. */
  perSource?: Record<string, 'mock' | 'implementation'>;
  inputs: RunRequestInput[];
  /** Raw text. */
  timeoutMs: string;
}

export interface FieldError {
  /** `workflowId`, `baseUrl.<source>`, `input.<name>` or `timeoutMs`. */
  field: string;
  message: string;
}

const NUMBER = /^-?\d+(\.\d+)?$/;
const INTEGER = /^-?\d+$/;
const ABSOLUTE_URL = /^https?:\/\/[^\s/]+\S*$/;

/**
 * Validates the run form. Returns the errors in field order (workflow, base URLs, inputs,
 * timeout), ready for an error summary that links to the fields. `[]` means valid.
 *
 * Messages are those of the prototype, for example
 * "Use a dot as decimal separator (3.9): newPrice is a JSON number."
 */
export function validateRunRequest(form: RunRequestForm): FieldError[] {
  const errors: FieldError[] = [];

  if (form.notRunnableMessage) errors.push({ field: 'workflowId', message: form.notRunnableMessage });

  const needsUrl = (source: string) =>
    form.target === 'implementations' || (form.target === 'mixed' && form.perSource?.[source] === 'implementation');
  for (const source of form.sources) {
    if (!needsUrl(source)) continue;
    const url = (form.baseUrls[source] ?? '').trim();
    if (!url) errors.push({ field: `baseUrl.${source}`, message: `Enter the base URL of the ${source} implementation.` });
    else if (!ABSOLUTE_URL.test(url)) {
      errors.push({ field: `baseUrl.${source}`, message: `Enter an absolute http(s) URL, such as ${EXAMPLE_BASE_URL}.` });
    }
  }

  for (const input of form.inputs) {
    const text = input.value.trim();
    if (text === '') continue;
    if (input.type === 'number' && !NUMBER.test(text)) {
      errors.push({
        field: `input.${input.name}`,
        message: text.includes(',')
          ? `Use a dot as decimal separator (3.9): ${input.name} is a JSON number.`
          : `${input.name} must be a number.`,
      });
    } else if (input.type === 'integer' && !INTEGER.test(text)) {
      errors.push({ field: `input.${input.name}`, message: `${input.name} must be a whole number.` });
    }
  }

  const timeout = form.timeoutMs.trim();
  if (!(/^\d+$/.test(timeout) && parseInt(timeout, 10) >= 1)) {
    errors.push({ field: 'timeoutMs', message: 'Enter a whole number of milliseconds, 1 or more.' });
  }
  return errors;
}

/** Timeout to use when the field is invalid (keeps previews stable). */
export function timeoutOrDefault(text: string): number {
  const n = parseInt(text.trim(), 10);
  return Number.isFinite(n) && n >= 1 ? n : DEFAULT_RUN_TIMEOUT_MS;
}
