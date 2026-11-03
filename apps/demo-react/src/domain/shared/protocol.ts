/** API protocol of a service. Mirrors the `Protocol` type of the design system. */
export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT';

export const PROTOCOLS: readonly Protocol[] = ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT'];
