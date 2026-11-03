import type { Protocol } from '@/domain/shared';

export const fmt = (n: number) => n.toLocaleString('en-US');

export const PROTOCOL_ORDER: readonly Protocol[] = ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT', 'A2A'];

export const pluralize = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

/** Hash-router href for an in-app path. */
export const href = (path: string) => `#${path}`;

/** What a service exposes: A2A agents expose skills, every other protocol operations. */
export const operationUnit = (protocol: Protocol): 'skill' | 'operation' => (protocol === 'A2A' ? 'skill' : 'operation');

/** Page of a test run: the A2A conformance runner has its own screen (19). */
export const testRunHref = (run: { id: string; runner: string }): string =>
  run.runner === 'A2A_CONFORMANCE' ? `/tests/agent/${run.id}` : `/tests/runner/${run.id}`;
