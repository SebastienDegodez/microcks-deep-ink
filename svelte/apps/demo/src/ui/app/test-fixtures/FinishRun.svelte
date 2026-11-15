<script lang="ts">
  import { useReturnFocus } from '../focus.svelte.js';

  let done = $state(false);
  const { focusLater } = useReturnFocus();

  function finish() {
    done = true;
    focusLater(() => document.getElementById('verdict'));
  }
</script>

{#if done}<h2 id="verdict" tabindex="-1">Verdict</h2>{:else}<button type="button" onclick={finish}>Finish</button>{/if}
