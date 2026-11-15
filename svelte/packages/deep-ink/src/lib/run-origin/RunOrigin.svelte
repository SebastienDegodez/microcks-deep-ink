<script lang="ts">
  import type { RunOriginProps } from './run-origin.js';
  import { eventProps } from '../event-props';



  let { origin, sessionId, class: cssClass, ...rest }: RunOriginProps = $props();

  const WORD = { ui: 'UI', api: 'API', 'mock-url': 'Mock URL', session: 'Session' } as const;
</script>

<span {...eventProps(rest)} class={['run-origin', cssClass].filter(Boolean).join(' ')} data-origin={origin}
  >{WORD[origin]}{#if origin === 'session' && sessionId}<code>{sessionId}</code>{/if}</span
>
