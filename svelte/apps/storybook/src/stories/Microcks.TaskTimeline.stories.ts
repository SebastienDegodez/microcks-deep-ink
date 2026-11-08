import PlaygroundExample from './Microcks.TaskTimeline/Playground.svelte';
import StateMachineDiffExample from './Microcks.TaskTimeline/StateMachineDiff.svelte';
import SelectableExample from './Microcks.TaskTimeline/Selectable.svelte';
import TimelineExample from './Microcks.TaskTimeline/Timeline.svelte';
import OtherStatesExample from './Microcks.TaskTimeline/OtherStates.svelte';
import StatesExample from './Microcks.TaskTimeline/States.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { TaskLanes, TaskStateTag, TaskTimeline } from '@microcks/deep-ink';

import { itemParams } from './_meta';

export default {
  title: 'Microcks/TaskTimeline',
  component: TaskTimeline,
  parameters: itemParams(['task-timeline', 'icon'], 'The lifecycle of an A2A task. `TaskStateTag` writes one state (glyph + word), `TaskTimeline` chains them and can select the steps of a script, and `TaskLanes` lays the expected and the actual lifecycle side by side. Color never carries the state alone: the word and the glyph shape do.'),
} satisfies Meta<typeof TaskTimeline>;

export const States: StoryObj = {
  render: () => ({ Component: StatesExample, props: {} }),
};

/** The terminal states `auth-required`, `canceled` and `rejected`, a ghost tag, a custom `label` and `showUnreached={false}`. */
export const OtherStates: StoryObj = {
  name: 'Other states',
  render: () => ({ Component: OtherStatesExample, props: {} }),
};

export const Timeline: StoryObj = {
  render: () => ({ Component: TimelineExample, props: {} }),
};

export const Selectable: StoryObj<typeof SelectableExample> = {
  render: () => ({ Component: SelectableExample, props: {} }),
};

export const StateMachineDiff: StoryObj = {
  name: 'State-machine diff',
  render: () => ({ Component: StateMachineDiffExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof TaskTimeline> = {
  args: {
    label: 'Task lifecycle', showUnreached: true, selectedIndex: 1,
    nodes: [{ state: 'submitted', at: '09:10:01' }, { state: 'working', at: '09:10:03', connector: '2 s' }, { state: 'completed', at: '09:10:09', connector: '6 s' }],
  },
  argTypes: { onselectnode: { table: { disable: true } } },
  render: (args) => ({ Component: PlaygroundExample, props: args }),
};
