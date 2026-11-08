import DefaultComposition from './Components.Button/Default.svelte';
import FormFooterComposition from './Components.Button/FormFooter.svelte';
import SizesComposition from './Components.Button/Sizes.svelte';
import WithIconComposition from './Components.Button/WithIcon.svelte';
import StatesComposition from './Components.Button/States.svelte';
import AsLinkComposition from './Components.Button/AsLink.svelte';
import CardFooterComposition from './Components.Button/CardFooter.svelte';
import PlaygroundComposition from './Components.Button/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Button, ButtonLink } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Button',
  component: Button,
  parameters: itemParams(['button'], 'A sturdy, near-square native `<button>`. One primary per task region. The medium size is 40px high, large 44px (form footers); small (32px) and compact (34px) are never used for the primary action of a page.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition, props: {} })
};

export const FormFooter: StoryObj<typeof FormFooterComposition> = {
  name: 'Form footer, inline delete',
  render: () => ({ Component: FormFooterComposition, props: {} })
};

export const Sizes: StoryObj<typeof SizesComposition> = {
  render: () => ({ Component: SizesComposition, props: {} })
};

export const WithIcon: StoryObj<typeof WithIconComposition> = {
  name: 'Icons',
  render: () => ({ Component: WithIconComposition, props: {} })
};

export const States: StoryObj<typeof StatesComposition> = {
  render: () => ({ Component: StatesComposition, props: {} })
};

export const AsLink: StoryObj<typeof AsLinkComposition> = {
  name: 'As a link',
  render: () => ({ Component: AsLinkComposition, props: {} })
};

export const CardFooter: StoryObj<typeof CardFooterComposition> = {
  name: 'Card footer (tile, 36px)',
  render: () => ({ Component: CardFooterComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { children: 'Run test', variant: 'primary', size: 'md', icon: undefined, iconOnly: false, loading: false, confirm: false, disabled: false },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'compact', 'tile', 'md', 'lg'] },
    tone: { control: 'inline-radio', options: [undefined, 'danger', 'link'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
