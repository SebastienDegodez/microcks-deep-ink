<script lang="ts">
  import { Button } from '@microcks/deep-ink';
  let { helpers = false }: { helpers?: boolean } = $props();
</script>
<div class="sb-page">
  {#if helpers}
    <div class="stack">
      <p class="sb-note"><code>.stack</code> lays children in a column, <code>.inline</code> in a wrapping row. Gap comes from <code>--gap</code>.</p>
      <div class="inline"><span class="sb-box" aria-hidden="true"></span><span class="sb-box" aria-hidden="true"></span><span class="sb-box" aria-hidden="true"></span></div>
      <p>A screen reader reads: <span class="sr-only">(hidden helper text) </span>the text next to it. Look: nothing is shown for the helper.</p>
    </div>
  {:else}
    <p class="sb-note">Press Tab to move focus: the ring is the same on every control.</p>
    <div class="inline"><Button>Secondary</Button><Button variant="primary">Primary</Button><a class="link" href="#focus">A link</a><input class="input" aria-label="A text input" value="Text input" /></div>
  {/if}
</div>
