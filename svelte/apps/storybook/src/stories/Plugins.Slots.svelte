<script lang="ts">
 import { Panel, PluginSlot } from '@microcks/deep-ink';
 let { variant }: { variant: string } = $props();
 const eventService = { theme: 'dark' as const, service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' as const } };
 const restService = { theme: 'dark' as const, service: { id: 'pastry', name: 'API Pastry', version: '2.0', protocol: 'REST' as const } };
</script>
{#if variant === 'CockpitWidgets'}<div style="max-width: 520px"><Panel title="Cockpit"><PluginSlot point="cockpit.widgets" context={eventService} outlined /></Panel></div>
{:else if variant === 'ConditionalTab'}<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px"><Panel title="EVENT service"><PluginSlot point="service.tabs" context={eventService} outlined><span class="sb-note">No plugin tab</span></PluginSlot></Panel><Panel title="REST service"><PluginSlot point="service.tabs" context={restService} outlined><span class="sb-note">No plugin tab: the contribution's `when` filter only accepts EVENT services.</span></PluginSlot></Panel></div>
{:else}<div style="width: 260px"><Panel title="Plugins" headingLevel={2}><nav aria-label="Plugin navigation"><PluginSlot point="nav.items" context={restService} outlined /></nav></Panel></div>{/if}
