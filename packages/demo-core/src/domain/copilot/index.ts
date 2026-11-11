import type { Example } from '../shared/index.js';

export interface SuggestionRequest {
  serviceId: string;
  operationId: string;
  count: number;
  hint?: string;
}

export interface ExportedExamples {
  format: 'yaml' | 'json';
  text: string;
}

/** A suggestion waiting for review (always `aiGenerated`, `reviewState: 'pending'`). */
export type PendingExample = Example & { aiGenerated: true; reviewState: 'pending' };

/** The workflow run that sent the person to the Copilot (a mock lacks an example). */
export interface WorkflowContext {
  documentId: string;
  workflowId: string;
  workflowSummary: string;
  runId: string;
  runNumber: number;
  /** `an example of GetPastryByName for name=Tarte Tatin` */
  missing: string;
  /** Arazzo operationId, `GetPastryByName`. */
  arazzoOperationId: string;
  /** Catalogue operation id, `get-name`. */
  operationId: string;
  /** `name=Tarte Tatin` */
  criteria: string;
}

/** Examples of one operation, for the APIExamples export. */
export interface ExampleGroup {
  /** `GET /pastries/{name}` */
  operationKey: string;
  examples: Example[];
}

/**
 * The mock serves ONE example per dispatch criteria. Returns the sentence shown on a proposal when an
 * existing example already answers the same parameters.
 */
export function findCriteriaConflict(proposal: Example, existing: readonly Example[]): string | undefined {
  const entries = Object.entries(proposal.request.params);
  if (entries.length === 0) return undefined;
  const clash = existing.find(
    (e) => e.id !== proposal.id && entries.every(([k, v]) => e.request.params[k] === v) && Object.keys(e.request.params).length === entries.length,
  );
  if (!clash) return undefined;
  const criteria = entries.map(([k, v]) => `${k}=${v}`).join(' && ');
  return `Dispatch criteria ${criteria} is already used by example "${clash.name}". The mock serves only one of them per criteria.`;
}

/** Message shown under the editor of a proposal, or undefined when the draft can be applied. */
export function validateExampleDraft(draft: { name: string; body: string }): string | undefined {
  try {
    JSON.parse(draft.body);
  } catch (error) {
    return `Invalid JSON: ${(error as Error).message}`;
  }
  if (!draft.name.trim()) return 'An example needs a name.';
  return undefined;
}

const PLAIN = /^[\w][\w .,/\-éèêëîïôûüçÉÈÊÎÔÛÇœŒ·]*$/;

function scalar(value: unknown): string {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const text = String(value);
  return PLAIN.test(text) && !/^\d/.test(text) ? text : `'${text.replace(/'/g, "''")}'`;
}

function yamlOf(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item !== null && typeof item === 'object') {
          const lines = yamlOf(item, indent + 1).split('\n');
          return `${pad}- ${(lines[0] ?? '').trim()}${lines.length > 1 ? `\n${lines.slice(1).join('\n')}` : ''}`;
        }
        return `${pad}- ${scalar(item)}`;
      })
      .join('\n');
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) =>
        v !== null && typeof v === 'object' ? `${pad}${k}:\n${yamlOf(v, indent + 1)}` : `${pad}${k}: ${scalar(v)}`,
      )
      .join('\n');
  }
  return `${pad}${scalar(value)}`;
}

function parseOr(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** The `APIExamples` secondary artifact (Microcks format) for the accepted examples. */
export function toApiExamples(
  target: { name: string; version: string },
  groups: readonly ExampleGroup[],
  format: 'yaml' | 'json',
): string {
  const operations: Record<string, Record<string, unknown>> = {};
  for (const group of groups) {
    if (group.examples.length === 0) continue;
    const byName: Record<string, unknown> = {};
    for (const e of group.examples) {
      const parameters = Object.fromEntries(Object.entries(e.request.params));
      const request: Record<string, unknown> = { parameters, headers: { Accept: 'application/json' } };
      if (e.request.body) request.body = parseOr(e.request.body);
      byName[e.name] = { request, response: { status: String(e.response.status), mediaType: 'application/json', body: parseOr(e.response.body) } };
    }
    operations[group.operationKey] = byName;
  }
  const doc = { apiVersion: 'mocks.microcks.io/v1alpha1', kind: 'APIExamples', metadata: { name: target.name, version: target.version }, operations };
  if (format === 'json') return JSON.stringify(doc, null, 2);
  let text = `apiVersion: ${doc.apiVersion}\nkind: APIExamples\nmetadata:\n  name: ${target.name}\n  version: '${target.version}'\noperations:`;
  for (const [key, byName] of Object.entries(operations)) {
    text += `\n  '${key}':`;
    for (const [name, value] of Object.entries(byName)) {
      const nameKey = /^[\w][\w .\-éèêëîïôûüç·]*$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`;
      text += `\n    ${nameKey}:\n${yamlOf(value, 3)}`;
    }
  }
  return text;
}
