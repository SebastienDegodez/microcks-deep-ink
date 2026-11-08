import exampleSource0 from './Microcks.RunTarget/Default.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import DefaultExample from './Microcks.RunTarget/Default.svelte';
import { RunTarget } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunTarget',
  component: RunTarget,
  parameters: itemParams(['run-target', 'chip'], 'What a workflow run calls. "Mixed" is a proposal beyond the POC and says so in text, with a dashed chip.'),
} satisfies Meta<typeof RunTarget>;

export const Default: StoryObj = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunTarget> = {
  parameters: { docs: { source: { code: `<script>
  import { RunTarget } from '@microcks/deep-ink';
</script>

<RunTarget target="mocks" />`, language: 'svelte', type: 'code' } } },
  args: { target: 'mocks' },
  argTypes: { target: { control: 'inline-radio', options: ['mocks', 'implementations', 'mixed'] } },
};
