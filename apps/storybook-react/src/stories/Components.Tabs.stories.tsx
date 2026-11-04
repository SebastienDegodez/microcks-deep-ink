import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { TabPanel, Tabs } from '@microcks-deep-ink/registry/react/tabs';
import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: itemParams(['tabs'], 'WAI-ARIA tabs. Use them to switch views of one page, not to navigate between pages. The count is read with the label ("Operations, 4").'),
} satisfies Meta<typeof Tabs>;

function Demo({ activation }: { activation: 'automatic' | 'manual' }) {
  const [v, setV] = useState('operations');
  return (
    <Tabs label="Service sections" items={SERVICE_TABS} value={v} onChange={setV} activation={activation}>
      {SERVICE_TABS.map((t) => (
        <TabPanel key={t.id} id={t.id} value={v}>
          <p style={{ margin: 0 }}>Content of the {t.label} tab.</p>
        </TabPanel>
      ))}
    </Tabs>
  );
}

export const Default: StoryObj = { render: () => <Demo activation="automatic" /> };

/** `idPrefix` keeps tab and panel ids unique when two tab lists share a page. */
export const IdPrefix: StoryObj = {
  name: 'Two lists on a page (idPrefix)',
  render: () => {
    const [a, setA] = useState('operations');
    const [b, setB] = useState('operations');
    return (
      <div className="sb-col">
        <Tabs label="Service A" idPrefix="a" items={SERVICE_TABS} value={a} onChange={setA}>
          <TabPanel id={a} value={a} idPrefix="a"><p style={{ margin: 0 }}>Service A, {a}.</p></TabPanel>
        </Tabs>
        <Tabs label="Service B" idPrefix="b" variant="card" items={SERVICE_TABS} value={b} onChange={setB}>
          <TabPanel id={b} value={b} idPrefix="b"><p style={{ margin: 0 }}>Service B, {b}.</p></TabPanel>
        </Tabs>
      </div>
    );
  },
};

export const ManualActivation: StoryObj = {
  name: 'Manual activation',
  parameters: { docs: { description: { story: 'Arrow keys only move focus; Enter or Space selects. Use it when a panel is expensive to load.' } } },
  render: () => <Demo activation="manual" />,
};

export const WithDisabledTab: StoryObj = {
  name: 'Disabled tab',
  render: () => {
    const [v, setV] = useState('operations');
    const items = SERVICE_TABS.map((t) => (t.id === 'contracts' ? { ...t, disabled: true } : t));
    return (
      <Tabs label="Service sections" items={items} value={v} onChange={setV}>
        <TabPanel id={v} value={v}>
          <p style={{ margin: 0 }}>Arrow keys skip the disabled tab.</p>
        </TabPanel>
      </Tabs>
    );
  },
};

export const LiveAndAlert: StoryObj = {
  name: 'Live dot and warning count',
  parameters: { docs: { description: { story: 'A live dot before the label (read "Tasks, live") and a warning pill (read "Users, 2 pending changes").' } } },
  render: () => {
    const [v, setV] = useState('tasks');
    const items = [
      { id: 'tasks', label: 'Tasks', count: 5, live: true },
      { id: 'users', label: 'Users', count: 12, alert: 2, alertLabel: 'pending changes' },
      { id: 'secrets', label: 'Secrets', count: 3 },
    ];
    return (
      <Tabs label="Sections" items={items} value={v} onChange={setV}>
        <TabPanel id={v} value={v}>
          <p style={{ margin: 0 }}>Content of the {v} tab.</p>
        </TabPanel>
      </Tabs>
    );
  },
};

const SOURCE_TABS = [
  { id: 'file', label: 'Upload', hint: 'one-off file', icon: 'document' as const },
  { id: 'url', label: 'URL', hint: 'fetched on demand', icon: 'link' as const },
  { id: 'git', label: 'Git repository', hint: 'kept in sync', icon: 'git-branch' as const },
  { id: 'direct', label: 'Direct API', hint: 'no contract', icon: 'zap' as const },
];

export const CardWithIcons: StoryObj = {
  name: 'Card variant, icons and hints (Import)',
  render: () => {
    const [v, setV] = useState('file');
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--canvas)' }}>
        <Tabs label="Source type" variant="card" items={SOURCE_TABS} value={v} onChange={setV}>
          {SOURCE_TABS.map((t) => (
            <TabPanel key={t.id} id={t.id} value={v}>
              <p style={{ margin: 0, padding: '0 20px 20px' }}>Content of the {t.label} tab.</p>
            </TabPanel>
          ))}
        </Tabs>
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Tabs> = {
  args: {
    label: 'Service sections', value: 'operations', activation: 'automatic', variant: 'line', idPrefix: 'pg',
    items: [{ id: 'operations', label: 'Operations', count: 8 }, { id: 'tests', label: 'Tests', alert: 1, alertLabel: 'failing' }, { id: 'contract', label: 'Contract' }],
  },
  argTypes: {
    activation: { control: 'inline-radio', options: ['automatic', 'manual'] },
    variant: { control: 'inline-radio', options: ['line', 'card'] },
    onChange: { table: { disable: true } },
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <>
        <Tabs {...args} value={value} onChange={setValue} />
        {args.items.map((i) => <TabPanel key={i.id} id={i.id} value={value} idPrefix={args.idPrefix}><p>{i.label} panel</p></TabPanel>)}
      </>
    );
  },
};
