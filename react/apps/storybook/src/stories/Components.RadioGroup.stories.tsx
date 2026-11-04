import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { RadioGroup } from '@microcks-deep-ink/registry/react/checkbox';
import { itemParams } from './_meta';

export default {
  title: 'Components/Radio group',
  component: RadioGroup,
  parameters: itemParams(['checkbox'], 'A `<fieldset>` with a `<legend>`: the group name is read before each option. Arrow keys move and select, as native radios do.'),
} satisfies Meta<typeof RadioGroup>;

const OPTIONS = [
  { value: 'mocks', label: 'Mocks', description: 'Call the Microcks mock endpoints.' },
  { value: 'implementations', label: 'Implementations', description: 'Call the real services.' },
  { value: 'mixed', label: 'Mixed', description: 'Proposed, beyond the POC.' },
];

export const Default: StoryObj = {
  render: () => {
    const [v, setV] = useState<string | undefined>('mocks');
    return <RadioGroup legend="Run against" options={OPTIONS} value={v} onChange={setV} />;
  },
};

export const WithError: StoryObj = {
  name: 'Error',
  render: () => {
    const [v, setV] = useState<string | undefined>(undefined);
    return <RadioGroup legend="Run against" required options={OPTIONS} value={v} onChange={setV} error="Choose what the workflow runs against." />;
  },
};

export const Cards: StoryObj = {
  render: function Render() {
    const [mode, setMode] = useState('sync');
    return (
      <div style={{ maxWidth: 420 }}>
        <RadioGroup
          legend="Install mode"
          variant="card"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'sync', label: 'Keep in sync', description: 'Microcks re-imports the package when the Hub publishes a new version.' },
            { value: 'once', label: 'Import once', description: 'A one-time copy; later versions are not imported.' },
          ]}
        />
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RadioGroup> = {
  args: { legend: 'Run against', options: OPTIONS, value: 'mocks', name: 'target', required: false, help: 'Pick where the test sends its requests.', error: undefined, variant: 'plain' },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card', 'compact'] }, onChange: { table: { disable: true } } },
  render: (args) => {
    const [value, setValue] = useState<string | undefined>(args.value);
    return <RadioGroup {...args} value={value} onChange={setValue} />;
  },
};
