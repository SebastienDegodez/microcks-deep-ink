import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { PluginSlot } from '@microcks-deep-ink/registry/react/plugin-slot';
import { Panel } from '@microcks-deep-ink/registry/react/panel';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import { itemParams } from './_meta';

export default {
  title: 'Elements/PluginSlot',
  component: PluginSlot,
  parameters: itemParams(['plugin-slot', 'panel'], 'Renders the contributions of installed plugins for an extension point, in light DOM, so the design system classes and the tokens reach plugin elements. Each contribution is wrapped in `<div class="plugin-item" data-plugin-id>`. Slot children are the fallback when nothing contributes.'),
  loaders: [async () => ({ ready: await registerDemoPlugin() })],
} satisfies Meta<typeof PluginSlot>;

const eventService = { theme: 'dark' as const, service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' as const } };

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Panel title="Cockpit">
        <PluginSlot point="cockpit.widgets" context={eventService} outlined />
      </Panel>
    </div>
  ),
};

export const Fallback: StoryObj = {
  name: 'Fallback content',
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Panel title="Observability">
        <PluginSlot point="operation.panels" context={eventService} outlined>
          <span className="sb-note">No plugin contributes to this point: this is the slot fallback.</span>
        </PluginSlot>
      </Panel>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PluginSlot> = {
  args: { point: 'cockpit.widgets', context: eventService, outlined: true },
  argTypes: { point: { control: 'select', options: ['cockpit.widgets', 'service.tabs', 'operation.panels', 'nav.items'] } },
  decorators: [(Story) => <div style={{ maxWidth: 520 }}><Story /></div>],
};
