import SmallExample from './Microcks.DropZone/Small.svelte';
import SingleExample from './Microcks.DropZone/Single.svelte';
import DefaultExample from './Microcks.DropZone/Default.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { DropZone } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/DropZone',
  component: DropZone,
  parameters: itemParams(['drop-zone', 'button', 'icon'], 'Drag and drop is an enhancement. The zone holds a real `<input type="file">` and a visible "Choose files" button, so keyboard and screen reader users upload the same way. A live region announces "2 files ready".'),
} satisfies Meta<typeof DropZone>;

export const Default: StoryObj<typeof DefaultExample> = {
  render: () => ({ Component: DefaultExample, props: {} }),
};

export const Single: StoryObj = {
  name: 'Single file',
  render: () => ({ Component: SingleExample, props: {} }),
};

export const Small: StoryObj = {
  name: 'Small, in a panel (Admin snapshots)',
  render: () => ({ Component: SmallExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof DropZone> = {
  args: { heading: 'Drop a contract here', hint: 'OpenAPI, AsyncAPI, gRPC or GraphQL.', accept: '.yaml,.yml,.json', multiple: true, chooseLabel: 'Choose files', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'sm'] }, onfiles: { table: { disable: true } } },
};
