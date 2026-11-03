import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect, useState } from 'react';
import { MkApiBadge, MkPanel, MkPluginSlot, MkSideNav, getPluginHost } from '@microcks-deep-ink/react';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import { SAMPLE_MANIFEST } from '@microcks-deep-ink/storybook-shared/fixtures';

const meta: Meta = {
  title: 'Plugins',
  loaders: [async () => ({ ready: await registerDemoPlugin() })],
  parameters: {
    docs: {
      description: {
        component:
          'A marketplace plugin ships a backend part (loaded by the Microcks server) and/or a frontend part: an ES module that registers custom elements into **extension points**. `mk-plugin-slot` renders them. The demo plugin below is a plain Web Component, so it renders the same in React and Angular.',
      },
    },
  },
};
export default meta;

const eventService = { theme: 'dark' as const, service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' as const } };
const restService = { theme: 'dark' as const, service: { id: 'pastry', name: 'API Pastry', version: '2.0', protocol: 'REST' as const } };

export const CockpitWidgets: StoryObj = {
  name: 'Slot · cockpit.widgets',
  render: () => (
    <MkPanel heading="Cockpit" style={{ maxWidth: 520 }}>
      <MkPluginSlot point="cockpit.widgets" context={eventService} outlined />
    </MkPanel>
  ),
};

export const ConditionalTab: StoryObj = {
  name: 'Slot · service.tabs (when)',
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <MkPanel heading="EVENT service">
        <MkPluginSlot point="service.tabs" context={eventService} outlined>
          <span className="di-note">No plugin tab</span>
        </MkPluginSlot>
      </MkPanel>
      <MkPanel heading="REST service">
        <MkPluginSlot point="service.tabs" context={restService} outlined>
          <span className="di-note">No plugin tab: the contribution's `when` filter only accepts EVENT services.</span>
        </MkPluginSlot>
      </MkPanel>
    </div>
  ),
};

export const NavContribution: StoryObj = {
  name: 'Slot · nav.items',
  render: () => (
    <div style={{ width: 240, height: 600 }}>
      <MkSideNav active="cockpit" />
    </div>
  ),
};

export const Marketplace: StoryObj = {
  name: 'Installed plugins',
  render: () => {
    const [list, setList] = useState(getPluginHost().list());
    useEffect(() => getPluginHost().subscribe(() => setList(getPluginHost().list())), []);
    return (
      <div className="di-col" style={{ maxWidth: 640 }}>
        {list.map((m) => (
          <MkPanel key={m.id} heading={m.name} subheading={`${m.id} · ${m.version} · Microcks ${m.microcks}`}>
            <div className="di-col">
              <span>{m.description}</span>
              <div className="di-stack">
                {m.protocols?.map((p) => <MkApiBadge key={p} protocol={p} name={m.name} version={m.version} />)}
                {m.backend && <MkApiBadge label="backend" value={m.backend.extensions.map((e) => e.point).join(', ')} status="neutral" />}
                {m.frontend && <MkApiBadge label="frontend" value={m.frontend.contributes.join(', ')} status="info" />}
              </div>
            </div>
          </MkPanel>
        ))}
        <pre style={{ font: 'var(--type-code)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-panel)', padding: 16, overflow: 'auto', color: 'var(--text-secondary)' }}>
          {JSON.stringify(SAMPLE_MANIFEST, null, 2)}
        </pre>
      </div>
    );
  },
};
