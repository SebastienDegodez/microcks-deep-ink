// Deep Ink · method-tag@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';

/** The protocol union shared by method-tag, chip and api-badge (they re-export it from here). */
export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

export interface MethodTagProps extends HTMLAttributes<HTMLSpanElement> {
  /** GET/POST... for REST, SUBSCRIBE/PUBLISH for EVENT, the RPC name for gRPC, QUERY/MUTATION for GraphQL. */
  method: string;
  protocol?: Protocol;
  /** Fixed minimum width in px, so tags line up in a list (Import 52, Service 48, Usage 46, Traces 44). */
  minWidth?: number;
  /** `sm`: 11px 600, padding 1px 5px, 44px wide unless `minWidth` is set (step lists). `xs`: 10px 600, no minimum width (dense tables). */
  size?: 'md' | 'sm' | 'xs';
}

/** `data-protocol` value of each protocol. */
export const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };

/** The verb is the text, so color is never the only signal. */
export function MethodTag({ method, protocol = 'REST', minWidth, size = 'md', className, style, ...rest }: MethodTagProps) {
  return (
    <span {...rest} className={['method', className].filter(Boolean).join(' ')} data-method={method} data-protocol={PROTOCOL_ATTR[protocol]} data-size={size === 'md' ? undefined : size} style={minWidth ? { ...style, ['--method-min-width' as string]: `${minWidth}px` } : style}>
      {method}
    </span>
  );
}
