import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Checkbox } from '@microcks-deep-ink/registry/react/checkbox';
import { itemParams } from './_meta';

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: itemParams(['checkbox'], 'A native checkbox inside its label. The description is linked with `aria-describedby`.'),
} satisfies Meta<typeof Checkbox>;

export const Default: StoryObj = {
  render: () => {
    const [on, setOn] = useState(true);
    return <Checkbox label="Validate responses against the schema" checked={on} onChange={(e) => setOn(e.target.checked)} />;
  },
};

export const WithDescription: StoryObj = {
  render: () => (
    <Checkbox label="Run on every import" description="Triggers a conformance test whenever the contract changes." defaultChecked />
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <div className="stack">
      <Checkbox label="Disabled, unchecked" disabled />
      <Checkbox label="Disabled, checked" disabled defaultChecked />
    </div>
  ),
};

export const CompactCards: StoryObj = {
  name: 'Compact cards (dense list)',
  render: () => {
    const [sel, setSel] = useState<Record<string, boolean>>({ a: true, b: true, c: false });
    const ops = [['a', 'GET /pastries'], ['b', 'GET /pastries/{name}'], ['c', 'PATCH /pastries/{name}']] as const;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 360 }}>
        {ops.map(([id, label]) => (
          <Checkbox key={id} variant="compact" label={label} checked={sel[id]} onChange={(e) => setSel({ ...sel, [id]: e.target.checked })} />
        ))}
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Checkbox> = {
  args: { label: 'Run on every push', description: 'The test starts from your CI pipeline.', variant: 'plain', disabled: false },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card', 'compact'] } },
};
