import type { Protocol } from '../../domain/shared/index.js';

export const fmt = (n: number) => n.toLocaleString('en-US');

export const PROTOCOL_ORDER: readonly Protocol[] = ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT', 'A2A'];

export const pluralize = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

/** Unformatted count with its noun: `1 run`, `3 runs`. */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Short elapsed time since an event, from seconds: `just now`, `12 s ago`, `4 min ago`, `2 h ago`. */
export const ago = (s: number): string => (s < 3 ? 'just now' : s < 60 ? `${s} s ago` : s < 3600 ? `${Math.floor(s / 60)} min ago` : `${Math.floor(s / 3600)} h ago`);

/** English month abbreviations, indexed like `Date#getUTCMonth`. */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Hash-router href for an in-app path. */
export const href = (path: string) => `#${path}`;

/** What a service exposes: A2A agents expose skills, every other protocol operations. */
export const operationUnit = (protocol: Protocol): 'skill' | 'operation' => (protocol === 'A2A' ? 'skill' : 'operation');

/** Page of a test run: the A2A conformance runner has its own screen (19). */
export const testRunHref = (run: { id: string; runner: string }): string =>
  run.runner === 'A2A_CONFORMANCE' ? `/tests/agent/${run.id}` : `/tests/runner/${run.id}`;
