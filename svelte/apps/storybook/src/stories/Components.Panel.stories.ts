import DefaultComposition from './Components.Panel/Default.svelte';
import AsAsideComposition from './Components.Panel/AsAside.svelte';
import FlushComposition from './Components.Panel/Flush.svelte';
import LabelTitleComposition from './Components.Panel/LabelTitle.svelte';
import { children } from './Components.Panel/PlaygroundContent.svelte';
import PlaygroundComposition from './Components.Panel/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Button } from '@microcks/deep-ink';
import { Panel } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Panel',
  component: Panel,
  parameters: itemParams(['panel', 'button'], 'A `<section>` named by its heading through `aria-labelledby`. Pick `headingLevel` so the outline stays ordered.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `as` picks the landmark element: here an `aside`. */
export const AsAside: StoryObj<typeof AsAsideComposition> = {
  name: 'As an aside',
  render: () => ({ Component: AsAsideComposition, props: {} })
};

export const Flush: StoryObj<typeof FlushComposition> = {
  render: () => ({ Component: FlushComposition, props: {} })
};

export const LabelTitle: StoryObj<typeof LabelTitleComposition> = {
  name: 'Label title, large padding',
  render: () => ({ Component: LabelTitleComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { title: 'Last runs', headingLevel: 2, flush: false, titleStyle: 'heading', padding: 'md', as: 'section', children: children },
  argTypes: {
    titleStyle: { control: 'inline-radio', options: ['heading', 'label'] },
    padding: { control: 'inline-radio', options: ['md', 'lg'] },
    as: { control: 'inline-radio', options: ['section', 'div', 'article', 'aside'] },
    headingLevel: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
