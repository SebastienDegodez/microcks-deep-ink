<script lang="ts">
 import { Panel, PluginSlot } from '@microcks/deep-ink';
 let { variant }: { variant: string } = $props();
 const context = { theme: 'dark' as const, service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' as const } };
</script>
<div style="max-width: 520px"><Panel title={variant === 'Fallback' ? 'Observability' : 'Cockpit'}><PluginSlot point={variant === 'Fallback' ? 'operation.panels' : 'cockpit.widgets'} {context} outlined>{#if variant === 'Fallback'}<span class="sb-note">No plugin contributes to this point: this is the slot fallback.</span>{/if}</PluginSlot></Panel></div>
