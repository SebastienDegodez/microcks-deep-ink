// Deep Ink · method-tag@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT';

export interface MethodTagProps extends HTMLAttributes<HTMLSpanElement> {
  /** GET/POST... for REST, SUBSCRIBE/PUBLISH for EVENT, the RPC name for gRPC, QUERY/MUTATION for GraphQL. */
  method: string;
  protocol?: Protocol;
}

const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct' };

/** The verb is the text, so color is never the only signal. */
export function MethodTag({ method, protocol = 'REST', className, ...rest }: MethodTagProps) {
  return (
    <span {...rest} className={['method', className].filter(Boolean).join(' ')} data-method={method} data-protocol={PROTOCOL_ATTR[protocol]}>
      {method}
    </span>
  );
}
