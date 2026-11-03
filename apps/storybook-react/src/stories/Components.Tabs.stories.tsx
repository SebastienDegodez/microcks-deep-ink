import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { TabPanel, Tabs } from '@microcks-deep-ink/registry/react/tabs';
import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Components/Tabs',
  parameters: itemParams(['tabs'], 'WAI-ARIA tabs. Use them to switch views of one page, not to navigate between pages. The count is read with the label ("Operations, 4").'),
} satisfies Meta;

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
