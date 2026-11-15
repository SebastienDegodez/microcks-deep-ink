import { exampleUrlPath } from '../../domain/catalog/index.js';
import type { Example, Operation } from '../../domain/shared/index.js';

/** Review status of an AI proposal. */
export type Status = 'pending' | 'accepted' | 'rejected';

/** An AI proposal under review: its example, its status, and the state of its row and of its editor. */
export interface Item { example: Example; status: Status; edited: boolean; expanded: boolean; editing: boolean; draftName: string; draftBody: string }

/** A pending proposal, closed unless `expanded`, whose drafts start from the example. */
export const fresh = (example: Example, expanded = false): Item => ({
  example, status: 'pending', edited: false, expanded, editing: false, draftName: example.name, draftBody: example.response.body,
});

/** Where the mock serves the operation: `http://microcks.local:8080/rest/API+Pastry/2.0`. */
export interface MockTarget { host: string; basePath: string }

/** `path    name = Tartelette Framboise` lines: path parameters first, then the query ones. */
export function paramLines(op: Operation, params: Record<string, string>): string {
  const inPath = new Set([...op.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]));
  return Object.entries(params).map(([k, v]) => `${(inPath.has(k) ? 'path' : 'query').padEnd(8)}${k} = ${v}`).join('\n');
}

/** Request line of a proposal on the mock: `GET /rest/API+Pastry/2.0/pastries/Tartelette%20Framboise`. */
export const requestLine = (op: Operation, target: MockTarget, e: Example) => `${op.method} ${target.basePath}${exampleUrlPath(op.path, e.request.params)}`;

/** Request line and headers of a proposal, as the mock receives them. */
export const requestText = (reqLine: string, target: MockTarget, e: Example) =>
  `${reqLine} HTTP/1.1\nHost: ${target.host}\nAccept: application/json${e.request.body ? '\nContent-Type: application/json' : ''}`;

/** Parameters of a proposal as `key=value` joined with " · ", the line next to its name. */
export const proposalSub = (e: Example) => Object.entries(e.request.params).map(([k, v]) => `${k}=${v}`).join(' · ');
