import exampleSource0 from './Components.Button/Default.svelte?raw';
import exampleSource1 from './Components.Button/FormFooter.svelte?raw';
import exampleSource2 from './Components.Button/Sizes.svelte?raw';
import exampleSource3 from './Components.Button/WithIcon.svelte?raw';
import exampleSource4 from './Components.Button/States.svelte?raw';
import exampleSource5 from './Components.Button/AsLink.svelte?raw';
import exampleSource6 from './Components.Button/CardFooter.svelte?raw';
import exampleSource7 from './Components.Button/Playground.svelte?raw';
import exampleSource8 from './Components.Button/CssCheck.svelte?raw';
import DefaultComposition from './Components.Button/Default.svelte';
import FormFooterComposition from './Components.Button/FormFooter.svelte';
import SizesComposition from './Components.Button/Sizes.svelte';
import WithIconComposition from './Components.Button/WithIcon.svelte';
import StatesComposition from './Components.Button/States.svelte';
import AsLinkComposition from './Components.Button/AsLink.svelte';
import CardFooterComposition from './Components.Button/CardFooter.svelte';
import PlaygroundComposition from './Components.Button/Playground.svelte';
import CssCheckComposition from './Components.Button/CssCheck.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Button, ButtonLink } from '@microcks/deep-ink';
import { expect } from 'storybook/test';
import { itemParams } from './_meta';


export default {
  title: 'Components/Button',
  component: Button,
  parameters: itemParams(['button'], 'A sturdy, near-square native `<button>`. One primary per task region. The medium size is 40px high, large 44px (form footers); small (32px) and compact (34px) are never used for the primary action of a page.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** Proves the preview loads `@microcks/deep-ink/styles.css`: an unstyled button would not be 40px / 44px high. */
export const CssCheck: StoryObj<typeof CssCheckComposition> = {
  tags: ['ai-generated', '!dev', '!autodocs', '!manifest'],
  parameters: { docs: { source: { code: exampleSource8, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: CssCheckComposition, props: {} }),
  play: async ({ canvas }) => {
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Run test' })).height).toBe('40px');
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Launch test' })).height).toBe('44px');
  },
};

export const FormFooter: StoryObj<typeof FormFooterComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Form footer, inline delete',
  render: () => ({ Component: FormFooterComposition, props: {} })
};

export const Sizes: StoryObj<typeof SizesComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: SizesComposition, props: {} })
};

export const WithIcon: StoryObj<typeof WithIconComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  name: 'Icons',
  render: () => ({ Component: WithIconComposition, props: {} })
};

export const States: StoryObj<typeof StatesComposition> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: StatesComposition, props: {} })
};

export const AsLink: StoryObj<typeof AsLinkComposition> = {
  parameters: { docs: { source: { code: exampleSource5, language: 'svelte', type: 'code' } } },
  name: 'As a link',
  render: () => ({ Component: AsLinkComposition, props: {} })
};

export const CardFooter: StoryObj<typeof CardFooterComposition> = {
  parameters: { docs: { source: { code: exampleSource6, language: 'svelte', type: 'code' } } },
  name: 'Card footer (tile, 36px)',
  render: () => ({ Component: CardFooterComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource7, language: 'svelte', type: 'code' } } },
  args: { children: 'Run test', variant: 'primary', size: 'md', icon: undefined, iconOnly: false, loading: false, confirm: false, disabled: false },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'compact', 'tile', 'md', 'lg'] },
    tone: { control: 'inline-radio', options: [undefined, 'danger', 'link'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
