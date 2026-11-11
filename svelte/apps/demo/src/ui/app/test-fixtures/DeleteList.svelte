<script lang="ts">
  import { useReturnFocus } from '../focus.svelte.js';

  let rows = $state(['a', 'b']);
  let undo = $state(false);
  const { focusLater } = useReturnFocus();

  function remove(row: string) {
    rows = rows.filter((r) => r !== row);
    undo = true;
    focusLater('[data-undo]');
  }
</script>

<section aria-label="Rows">
  <ul>
    {#each rows as row (row)}
      <li><button type="button" onclick={() => remove(row)}>Delete {row}</button></li>
    {/each}
  </ul>
  {#if undo}<button type="button" data-undo>Undo</button>{/if}
</section>
