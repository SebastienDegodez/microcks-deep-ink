<script lang="ts">
  import DropZone from './DropZone.svelte';
</script>
<DropZone size="sm" heading="Drop a snapshot here" chooseLabel="Choose a file" multiple={false} accept=".json" onfiles={() => undefined}>
  {#snippet hint()}A <code>microcks-repository.json</code> exported from any Microcks instance{/snippet}
  <button type="button" class="button" data-variant="link">Use a sample snapshot</button>
</DropZone>
