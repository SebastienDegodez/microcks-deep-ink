import type { TestTarget } from './types.js';

export interface TestFormValues {
  endpoint: string;
  /** Raw text of the timeout field (milliseconds). */
  timeout: string;
  selectedOperations: string[];
  oauth: boolean;
  clientSecret: string;
}

export interface TestFormErrors {
  endpoint?: string;
  operations?: string;
  timeout?: string;
  clientSecret?: string;
}

export const TIMEOUT_MIN_MS = 1000;
export const TIMEOUT_MAX_MS = 30000;

/** Returns the timeout in ms when valid. */
export function parseTimeout(text: string): number | null {
  if (!/^\s*\d+\s*$/.test(text)) return null;
  const ms = parseInt(text, 10);
  return ms >= TIMEOUT_MIN_MS && ms <= TIMEOUT_MAX_MS ? ms : null;
}

export function validateEndpoint(type: TestTarget['type'], endpoint: string): string | undefined {
  const ep = endpoint.trim();
  if (!ep) return 'A test endpoint is required.';
  if (type === 'EVENT' && !/^(kafka|mqtt|amqp|nats|ws|wss|googlepubsub|sqs|sns):\/\/.+/.test(ep)) {
    return 'Use a broker URL such as kafka://host:9092/topic.';
  }
  if (type === 'GRPC' && !/^(grpc|grpcs|https?):\/\/.+/.test(ep)) return 'Use a gRPC endpoint such as grpc://host:9000.';
  if (type !== 'EVENT' && type !== 'GRPC' && !/^https?:\/\/\S+$/.test(ep)) return 'Use an http:// or https:// URL.';
  return undefined;
}

export function validateTestForm(type: TestTarget['type'], values: TestFormValues): TestFormErrors {
  const errors: TestFormErrors = {};
  const endpoint = validateEndpoint(type, values.endpoint);
  if (endpoint) errors.endpoint = endpoint;
  if (values.selectedOperations.length === 0) errors.operations = 'Select at least one operation to test.';
  if (parseTimeout(values.timeout) === null) errors.timeout = 'Enter a value between 1,000 and 30,000 ms.';
  if (values.oauth && !values.clientSecret) errors.clientSecret = 'The OAuth2 client secret is required.';
  return errors;
}

/** "3 operations · 7 samples · OPEN_API_SCHEMA · up to 10 s" */
export function summarizeSelection(target: TestTarget, selected: string[], runner: string, waitSec: number): string {
  const ops = target.operations.filter((o) => selected.includes(o.id));
  const samples = ops.reduce((n, o) => n + o.samples, 0);
  return `${ops.length} ${ops.length === 1 ? 'operation' : 'operations'} · ${samples} samples · ${runner} · up to ${waitSec} s`;
}

export function timeoutHelp(text: string, isEvent: boolean): string {
  const ms = parseTimeout(text);
  if (ms === null) return 'Enter a value between 1,000 and 30,000 ms.';
  return `Waits up to ${Math.round(ms / 1000)} s for the results${isEvent ? ', listening for messages.' : '.'} Between 1,000 and 30,000 ms.`;
}
