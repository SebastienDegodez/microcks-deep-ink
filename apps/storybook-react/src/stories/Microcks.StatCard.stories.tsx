import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LiveIndicator } from '@microcks-deep-ink/registry/react/live-indicator';
import { StatCard, StatGrid } from '@microcks-deep-ink/registry/react/stat-card';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/StatCard',
  component: StatCard,
  parameters: itemParams(['stat-card', 'live-indicator'], 'A key figure: a small heading (a real heading), the figure as text with its unit, and optional detail. The tone colours the figure only; the words carry the meaning.'),
} satisfies Meta<typeof StatCard>;

export const KeyFigures: StoryObj = {
  name: 'Key figures',
  render: () => (
    <StatGrid label="Key figures" style={{ maxWidth: 1000 }}>
      <StatCard title="APIs & services" value="11" unit="29 operations" action={<a href="#/services">Catalogue</a>} />
      <StatCard title="Mock invocations today" value="638" unit="requests" action={<LiveIndicator variant="inline" />}>
        <p>1,322 async messages published · last request 12 s ago</p>
      </StatCard>
      <StatCard title="Tests · last 7 days" value="20" unit="runs" action={<a href="#/tests">History</a>} />
      <StatCard title="Average conformance" value="78%" unit="current score" tone="warning" action={<a href="#/usage">Details</a>}>
        <p>Across 8 tested services · 3 never tested</p>
      </StatCard>
    </StatGrid>
  ),
};

/** `tone` colours the value; `headingLevel` keeps the page outline right inside a section. */
export const Tones: StoryObj = {
  render: () => (
    <StatGrid label="Last 24 hours">
      <StatCard title="Passed" headingLevel={3} value="9" tone="success">Runs without a failure.</StatCard>
      <StatCard title="Failed" headingLevel={3} value="3" tone="danger">Runs with a failing step.</StatCard>
    </StatGrid>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof StatCard> = {
  args: { title: 'Conformance', headingLevel: 2, value: '92', unit: '%', tone: 'success', children: 'Across 12 operations.' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'success', 'warning', 'danger'] },
    headingLevel: { control: 'inline-radio', options: [2, 3, 4, 5, 6] },
  },
};
