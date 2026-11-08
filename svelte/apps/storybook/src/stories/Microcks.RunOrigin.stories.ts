import DefaultExample from './Microcks.RunOrigin/Default.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { RunOrigin } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunOrigin',
  component: RunOrigin,
  parameters: itemParams(['run-origin'], 'Where a run was started from: UI, API, Mock URL or a session.'),
} satisfies Meta<typeof RunOrigin>;

export const Default: StoryObj = {
  render: () => ({ Component: DefaultExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunOrigin> = {
  args: { origin: 'ui', sessionId: undefined },
  argTypes: { origin: { control: 'select', options: ['ui', 'api', 'mock-url', 'session'] } },
};
