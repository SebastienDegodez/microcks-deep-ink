import exampleSource0 from './Microcks.TaskTimeline/States.svelte?raw';
import exampleSource1 from './Microcks.TaskTimeline/OtherStates.svelte?raw';
import exampleSource2 from './Microcks.TaskTimeline/Timeline.svelte?raw';
import exampleSource3 from './Microcks.TaskTimeline/Selectable.svelte?raw';
import exampleSource4 from './Microcks.TaskTimeline/StateMachineDiff.svelte?raw';
import exampleSource5 from './Microcks.TaskTimeline/Playground.svelte?raw';
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
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: StatesExample, props: {} }),
};

/** The terminal states `auth-required`, `canceled` and `rejected`, a ghost tag, a custom `label` and `showUnreached={false}`. */
export const OtherStates: StoryObj = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Other states',
  render: () => ({ Component: OtherStatesExample, props: {} }),
};

export const Timeline: StoryObj = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: TimelineExample, props: {} }),
};

export const Selectable: StoryObj<typeof SelectableExample> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: SelectableExample, props: {} }),
};

export const StateMachineDiff: StoryObj = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  name: 'State-machine diff',
  render: () => ({ Component: StateMachineDiffExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof TaskTimeline> = {
  parameters: { docs: { source: { code: exampleSource5, language: 'svelte', type: 'code' } } },
  args: {
    label: 'Task lifecycle', showUnreached: true, selectedIndex: 1,
    nodes: [{ state: 'submitted', at: '09:10:01' }, { state: 'working', at: '09:10:03', connector: '2 s' }, { state: 'completed', at: '09:10:09', connector: '6 s' }],
  },
  argTypes: { onselectnode: { table: { disable: true } } },
  render: (args) => ({ Component: PlaygroundExample, props: args }),
};
