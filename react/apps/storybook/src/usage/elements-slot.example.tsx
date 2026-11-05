import { Panel, PluginSlot } from '@microcks/deep-ink';

const context = { theme: 'dark' as const, service: { id: 'pastry', name: 'API Pastry', version: '2.0', protocol: 'REST' as const } };

export default function ServicePanels() {
  return (
    <Panel title="Service extensions" headingLevel={4} style={{ maxWidth: 520 }}>
      <PluginSlot point="service.header.badges" context={context} outlined>
        <p style={{ margin: 0 }}>Fallback: no installed plugin contributes a badge to this service.</p>
      </PluginSlot>
    </Panel>
  );
}
