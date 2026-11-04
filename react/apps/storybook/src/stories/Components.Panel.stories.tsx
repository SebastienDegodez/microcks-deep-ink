import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '@microcks/deep-ink';
import { Panel } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Components/Panel',
  component: Panel,
  parameters: itemParams(['panel', 'button'], 'A `<section>` named by its heading through `aria-labelledby`. Pick `headingLevel` so the outline stays ordered.'),
} satisfies Meta<typeof Panel>;

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Panel title="Mock URL" actions={<Button size="sm">Regenerate</Button>}>
        <p style={{ margin: 0 }}>Panel body.</p>
      </Panel>
    </div>
  ),
};

/** `as` picks the landmark element: here an `aside`. */
export const AsAside: StoryObj = {
  name: 'As an aside',
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <Panel as="aside" title="Related" headingLevel={3}><p style={{ margin: 0 }}>Links to other services.</p></Panel>
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

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Panel> = {
  args: { title: 'Last runs', headingLevel: 2, flush: false, titleStyle: 'heading', padding: 'md', as: 'section', children: <p>Three tests ran in the last hour.</p> },
  argTypes: {
    titleStyle: { control: 'inline-radio', options: ['heading', 'label'] },
    padding: { control: 'inline-radio', options: ['md', 'lg'] },
    as: { control: 'inline-radio', options: ['section', 'div', 'article', 'aside'] },
    headingLevel: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
  },
};
