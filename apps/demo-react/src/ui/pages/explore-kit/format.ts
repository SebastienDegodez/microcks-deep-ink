import type { Protocol } from '@/domain/shared';

export const fmt = (n: number) => n.toLocaleString('en-US');

export const PROTOCOL_ORDER: readonly Protocol[] = ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT'];

export const pluralize = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;

/** Hash-router href for an in-app path. */
export const href = (path: string) => `#${path}`;
