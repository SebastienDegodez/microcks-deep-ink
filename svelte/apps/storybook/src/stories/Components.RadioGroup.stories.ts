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
  render: () => ({ Component: DefaultComposition, props: {} })
};

export const WithError: StoryObj<typeof WithErrorComposition> = {
  name: 'Error',
  render: () => ({ Component: WithErrorComposition, props: {} })
};

export const Cards: StoryObj<typeof CardsComposition> = {
  render: () => ({ Component: CardsComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { legend: 'Run against', options: OPTIONS, value: 'mocks', name: 'target', required: false, help: 'Pick where the test sends its requests.', error: undefined, variant: 'plain' },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card', 'compact'] }, onchange: { table: { disable: true } } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
