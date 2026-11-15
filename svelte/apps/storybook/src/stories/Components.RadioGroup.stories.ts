import exampleSource0 from './Components.RadioGroup/Default.svelte?raw';
import exampleSource1 from './Components.RadioGroup/WithError.svelte?raw';
import exampleSource2 from './Components.RadioGroup/Cards.svelte?raw';
import exampleSource3 from './Components.RadioGroup/Playground.svelte?raw';
import DefaultComposition from './Components.RadioGroup/Default.svelte';
import WithErrorComposition from './Components.RadioGroup/WithError.svelte';
import CardsComposition from './Components.RadioGroup/Cards.svelte';
import PlaygroundComposition from './Components.RadioGroup/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { RadioGroup } from '@microcks/deep-ink';
import { itemParams } from './_meta';
const OPTIONS = [
  { value: 'mocks', label: 'Mocks', description: 'Call the Microcks mock endpoints.' },
  { value: 'implementations', label: 'Implementations', description: 'Call the real services.' },
  { value: 'mixed', label: 'Mixed', description: 'Proposed, beyond the POC.' },
];

export default {
  title: 'Components/Radio group',
  component: RadioGroup,
  parameters: itemParams(['checkbox'], 'A `<fieldset>` with a `<legend>`: the group name is read before each option. Arrow keys move and select, as native radios do.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

export const WithError: StoryObj<typeof WithErrorComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Error',
  render: () => ({ Component: WithErrorComposition, props: {} })
};

export const Cards: StoryObj<typeof CardsComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: CardsComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  args: { legend: 'Run against', options: OPTIONS, value: 'mocks', name: 'target', required: false, help: 'Pick where the test sends its requests.', error: undefined, variant: 'plain' },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card', 'compact'] }, onchange: { table: { disable: true } } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
