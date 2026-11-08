import { pill } from './Microcks.CiPanel/Playground.svelte';
import DefaultExample from './Microcks.CiPanel/Default.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';


import { CiPanel } from '@microcks/deep-ink';

import { itemParams } from './_meta';

export default {
  title: 'Microcks/CiPanel',
  component: CiPanel,
  parameters: itemParams(['ci-panel', 'copy-button', 'button'], '"Run it from CI": a region named by its title, shown by a toggle button with `aria-expanded` and `aria-controls`. Copy announces its result; the command wraps.'),
} satisfies Meta<typeof CiPanel>;


export const Default: StoryObj<typeof DefaultExample> = {
  render: () => ({ Component: DefaultExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof CiPanel> = {
  args: { title: 'Run it from your pipeline', pill, hint: 'Add this command to a CI job.', command: 'microcks test API-Pastry:2.0 http://pastry:8080 OPEN_API_SCHEMA', footnote: 'Needs the Microcks CLI.', dashed: false, copyLabel: 'Copy' },
};
