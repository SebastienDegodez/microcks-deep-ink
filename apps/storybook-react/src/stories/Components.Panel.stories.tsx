import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { Panel } from '@microcks-deep-ink/registry/react/panel';
import { itemParams } from './_meta';

export default {
  title: 'Components/Panel',
  parameters: itemParams(['panel', 'button'], 'A `<section>` named by its heading through `aria-labelledby`. Pick `headingLevel` so the outline stays ordered.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Panel title="Mock URL" actions={<Button size="sm">Regenerate</Button>}>
        <p style={{ margin: 0 }}>Panel body.</p>
      </Panel>
    </div>
  ),
};

export const Flush: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Panel title="Operations" headingLevel={3} flush>
        <p style={{ margin: 0, padding: 'var(--space-4)' }}>Flush removes the body padding, for tables and lists.</p>
      </Panel>
    </div>
  ),
};

export const LabelTitle: StoryObj = {
  name: 'Label title, large padding',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Panel title="Runner log" titleStyle="label" padding="lg">
        <p style={{ margin: 0 }}>An uppercase 12px title and a 20px padding.</p>
      </Panel>
    </div>
  ),
};
