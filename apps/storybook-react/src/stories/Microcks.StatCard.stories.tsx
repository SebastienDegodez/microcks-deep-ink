import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LiveIndicator } from '@microcks-deep-ink/registry/react/live-indicator';
import { StatCard, StatGrid } from '@microcks-deep-ink/registry/react/stat-card';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/StatCard',
  parameters: itemParams(['stat-card', 'live-indicator'], 'A key figure: a small heading (a real heading), the figure as text with its unit, and optional detail. The tone colours the figure only; the words carry the meaning.'),
} satisfies Meta;

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
