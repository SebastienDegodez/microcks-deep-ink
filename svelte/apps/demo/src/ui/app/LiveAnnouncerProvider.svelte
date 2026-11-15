<!--
  @component
  The shell's polite live region. Everything announced to screen readers goes through it: route
  changes (`usePageTitle`), result counts after filtering, "Copied", streaming progress summaries...

  Throttle frequent messages at the call site (the contract allows at most one announcement every
  2 s for streaming progress and every 5 s for Live traces).
-->
<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte';
  import { provideAnnouncer } from './announcer';

  let { children }: { children: Snippet } = $props();

  let message = $state('');
  let timer: ReturnType<typeof setTimeout> | undefined;

  provideAnnouncer((text) => {
    // Clear first so announcing the same text twice is still read.
    message = '';
    clearTimeout(timer);
    timer = setTimeout(() => (message = text), 50);
  });

  onDestroy(() => clearTimeout(timer));
</script>

{@render children()}<div role="status" aria-live="polite" aria-atomic="true" class="sr-only" data-testid="live-region">{message}</div>
