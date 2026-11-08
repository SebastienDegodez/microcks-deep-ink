<script lang="ts">
  import { Panel, PluginSlot } from '@microcks/deep-ink';
  const context = { theme: 'dark' as const, service: { id: 'pastry', name: 'API Pastry', version: '2.0', protocol: 'REST' as const } };
</script>
<Panel title="Service extensions" headingLevel={4} style="max-width:520px"><PluginSlot point="service.header.badges" {context} outlined><p style="margin:0">Fallback: no installed plugin contributes a badge to this service.</p></PluginSlot></Panel>
