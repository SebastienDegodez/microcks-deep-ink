
<script lang="ts" module>
  export type RunOriginKind = 'ui' | 'api' | 'mock-url' | 'session';
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> &
    NativeHandlers<HTMLSpanElement> & {
    origin: RunOriginKind;
    /** Shown with the session origin, e.g. "s-7f3a2c91". */
    sessionId?: string;
    class?: string;
  };

  let { origin, sessionId, class: cssClass, ...rest }: Props = $props();

  const WORD = { ui: 'UI', api: 'API', 'mock-url': 'Mock URL', session: 'Session' } as const;
</script>

<span {...eventProps(rest)} class={['run-origin', cssClass].filter(Boolean).join(' ')} data-origin={origin}
  >{WORD[origin]}{#if origin === 'session' && sessionId}<code>{sessionId}</code>{/if}</span
>
