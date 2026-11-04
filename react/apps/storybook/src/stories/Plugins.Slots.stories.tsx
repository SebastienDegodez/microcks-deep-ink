import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Panel } from '@microcks/deep-ink';
import { PluginSlot } from '@microcks/deep-ink';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import { itemParams } from './_meta';

export default {
  title: 'Plugins/Slots',
  parameters: itemParams(['plugin-slot', 'panel', 'api-badge', 'live-indicator'], 'A marketplace plugin ships a backend part (loaded by the Microcks server) and/or a frontend part: an ES module that registers custom elements into **extension points**. `plugin-slot` renders them. The demo plugin is a plain Web Component styled with the Deep Ink HTML recipes (live indicator, API badge), so it looks identical in React and Angular.'),
  loaders: [async () => ({ ready: await registerDemoPlugin() })],
} satisfies Meta;

const eventService = { theme: 'dark' as const, service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' as const } };
const restService = { theme: 'dark' as const, service: { id: 'pastry', name: 'API Pastry', version: '2.0', protocol: 'REST' as const } };

export const CockpitWidgets: StoryObj = {
  name: 'cockpit.widgets',
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Panel title="Cockpit">
        <PluginSlot point="cockpit.widgets" context={eventService} outlined />
      </Panel>
    </div>
  ),
};

export const ConditionalTab: StoryObj = {
  name: 'service.tabs (when)',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
      <Panel title="EVENT service">
        <PluginSlot point="service.tabs" context={eventService} outlined>
          <span className="sb-note">No plugin tab</span>
        </PluginSlot>
      </Panel>
      <Panel title="REST service">
        <PluginSlot point="service.tabs" context={restService} outlined>
          <span className="sb-note">No plugin tab: the contribution&apos;s `when` filter only accepts EVENT services.</span>
        </PluginSlot>
      </Panel>
    </div>
  ),
};

export const NavContribution: StoryObj = {
  name: 'nav.items',
  render: () => (
    <div style={{ width: 260 }}>
      <Panel title="Plugins" headingLevel={2}>
        <nav aria-label="Plugin navigation">
          <PluginSlot point="nav.items" context={restService} outlined />
        </nav>
      </Panel>
    </div>
  ),
};
