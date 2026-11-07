<!--
  Operation verb on the protocol color (registry item method-tag). Same props as the React MethodTag: method, protocol,
  minWidth, size, className, style (a string here) plus any <span> attribute and React handler (onClick...). The verb is the text, so color is never
  the only signal.
-->
<script lang="ts" module>
  /** The protocol union shared by method-tag, chip and api-badge (they re-export it from here). */
  export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

  /** `data-protocol` value of each protocol. */
  export const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    ReactHandlers<HTMLSpanElement> & {
    /** GET/POST... for REST, SUBSCRIBE/PUBLISH for EVENT, the RPC name for gRPC, QUERY/MUTATION for GraphQL. */
    method: string;
    protocol?: Protocol;
    /** Fixed minimum width in px, so tags line up in a list (Import 52, Service 48, Usage 46, Traces 44). */
    minWidth?: number;
    /** `sm`: 11px 600, 44px wide unless `minWidth` is set (step lists). `xs`: 10px 600, no minimum width (dense tables). */
    size?: 'md' | 'sm' | 'xs';
    className?: string;
  };

  let { method, protocol = 'REST', minWidth, size = 'md', className, style, ...rest }: Props = $props();
</script>

<span
  {...reactEvents(rest)}
  class={['method', className].filter(Boolean).join(' ')}
  data-method={method}
  data-protocol={PROTOCOL_ATTR[protocol]}
  data-size={size === 'md' ? undefined : size}
  style={minWidth ? [style, `--method-min-width:${minWidth}px`].filter(Boolean).join(';') : style}>{method}</span
>
