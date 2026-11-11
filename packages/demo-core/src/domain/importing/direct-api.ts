import type { DirectApiInput } from './types.js';

export type DirectApiErrors = Partial<Record<'name' | 'version' | 'resource' | 'payload', string>>;

/** Validation of the Direct API form. Events need a reference payload, REST accepts an optional template. */
export function validateDirectApi(input: DirectApiInput): DirectApiErrors {
  const errors: DirectApiErrors = {};
  if (!input.name.trim()) errors.name = 'Name the API, for example Order API.';
  if (!input.version.trim()) errors.version = 'Give a version, for example 1.0.';
  const resource = input.resource.trim();
  if (!resource) errors.resource = 'Name the resource, for example order.';
  else if (!/^[A-Za-z][\w-]*$/.test(resource)) errors.resource = 'Use letters, digits, dashes and underscores, starting with a letter.';
  const payload = (input.payload ?? '').trim();
  if (!payload && input.type === 'GENERIC_EVENT') errors.payload = 'An event API needs a reference JSON payload.';
  else if (payload) {
    try {
      JSON.parse(payload);
    } catch (error) {
      errors.payload = `Invalid JSON: ${(error as Error).message}`;
    }
  }
  return errors;
}

export interface DirectApiEndpoint {
  label: string;
  value: string;
  tryIt: string;
}

const plus = (text: string) => text.trim().replace(/\s+/g, '+');

/** Where the mock of a Direct API answers, and a command to try it. */
export function directApiEndpoint(input: DirectApiInput, baseUrl: string): DirectApiEndpoint {
  const name = input.name.trim();
  const version = input.version.trim();
  const resource = input.resource.trim();
  if (input.type === 'GENERIC_EVENT') {
    const topic = `${name.replace(/\s+/g, '')}-${version}-${resource}`;
    return { label: 'Mock Kafka topic', value: topic, tryIt: `kcat -b microcks-kafka:9092 -C -t ${topic}` };
  }
  const url = `${baseUrl}/dynarest/${plus(name)}/${version}/${resource}`;
  return {
    label: 'Mock base URL',
    value: url,
    tryIt: `curl -X POST ${url} \\\n  -H 'Content-Type: application/json' \\\n  -d '{"customer":"Laurent","status":"CREATED"}'`,
  };
}
