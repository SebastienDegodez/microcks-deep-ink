<script lang="ts">
 import { PluginSlot, type SlotContext, type ExtensionPointId } from '@microcks/deep-ink';
 let { point, context, outlined }: { point: ExtensionPointId; context?: SlotContext; outlined?: boolean } = $props();
</script>
<div style="max-width: 520px"><PluginSlot {point} {context} {outlined} /></div>
