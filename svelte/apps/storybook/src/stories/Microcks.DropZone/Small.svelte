<script lang="ts">
import { DropZone } from '@microcks/deep-ink';


</script>
<div style="max-width: 420px"><DropZone size="sm" heading="Drop a snapshot here" chooseLabel="Choose a file" multiple={false} accept="application/json,.json" onfiles={() => undefined}><button type="button" class="button" data-variant="link">Use a sample snapshot</button>{#snippet hint()}A <code>microcks-repository.json</code> exported from any Microcks instance{/snippet}</DropZone></div>
