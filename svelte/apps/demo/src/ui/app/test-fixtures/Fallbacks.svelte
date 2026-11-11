<script lang="ts">
  import { useReturnFocus } from '../focus.svelte.js';
  import { PAGE_TITLE_ID } from '../page-title.svelte.js';

  let { withRegion }: { withRegion: boolean } = $props();
  let shown = $state(true);
  const { focusLater } = useReturnFocus();

  function dismiss() {
    shown = false;
    focusLater('#does-not-exist');
  }
</script>

{#snippet button()}{#if shown}<button type="button" onclick={dismiss}>Dismiss</button>{/if}{/snippet}

<h1 id={PAGE_TITLE_ID} tabindex="-1">Page</h1>
{#if withRegion}<section aria-label="Panel">{@render button()}</section>{:else}{@render button()}{/if}
