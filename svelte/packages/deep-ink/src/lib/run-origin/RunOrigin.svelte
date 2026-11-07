<!--
  Where a run was launched from (registry item run-origin). Same props as the React RunOrigin: origin, sessionId,
  className plus any <span> attribute and React handler (onClick...).
-->
<script lang="ts" module>
  export type RunOriginKind = 'ui' | 'api' | 'mock-url' | 'session';
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    ReactHandlers<HTMLSpanElement> & {
    origin: RunOriginKind;
    /** Shown with the session origin, e.g. "s-7f3a2c91". */
    sessionId?: string;
    className?: string;
  };

  let { origin, sessionId, className, ...rest }: Props = $props();

  const WORD = { ui: 'UI', api: 'API', 'mock-url': 'Mock URL', session: 'Session' } as const;
</script>

<span {...reactEvents(rest)} class={['run-origin', className].filter(Boolean).join(' ')} data-origin={origin}
  >{WORD[origin]}{#if origin === 'session' && sessionId}<code>{sessionId}</code>{/if}</span
>
