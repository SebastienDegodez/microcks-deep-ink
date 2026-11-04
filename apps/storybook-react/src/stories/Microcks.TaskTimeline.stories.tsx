import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { TASK_STATES, TaskLanes, TaskStateTag, TaskTimeline } from '@microcks-deep-ink/registry/react/task-timeline';
import { AGENT_LANES, AGENT_LIFECYCLE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/TaskTimeline',
  component: TaskTimeline,
  parameters: itemParams(['task-timeline', 'icon'], 'The lifecycle of an A2A task. `TaskStateTag` writes one state (glyph + word), `TaskTimeline` chains them and can select the steps of a script, and `TaskLanes` lays the expected and the actual lifecycle side by side. Color never carries the state alone: the word and the glyph shape do.'),
} satisfies Meta<typeof TaskTimeline>;

export const States: StoryObj = {
  render: () => (
    <div className="inline">
      {TASK_STATES.map((s) => (
        <TaskStateTag key={s} state={s} />
      ))}
    </div>
  ),
};

/** The terminal states `auth-required`, `canceled` and `rejected`, a ghost tag, a custom `label` and `showUnreached={false}`. */
export const OtherStates: StoryObj = {
  name: 'Other states',
  render: () => (
    <div className="sb-col">
      <div className="inline">
        <TaskStateTag state="auth-required" />
        <TaskStateTag state="canceled" />
        <TaskStateTag state="rejected" />
        <TaskStateTag state="completed" ghost />
      </div>
      <TaskTimeline label="Cancelled task" showUnreached={false} nodes={[{ state: 'submitted', at: '09:10:01' }, { state: 'working', at: '09:10:03', connector: '2 s' }, { state: 'canceled', at: '09:10:05', connector: '2 s' }]} />
    </div>
  ),
};

export const Timeline: StoryObj = {
  render: () => <TaskTimeline nodes={AGENT_LIFECYCLE} />,
};

export const Selectable: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState<number | undefined>(2);
    return <TaskTimeline nodes={AGENT_LIFECYCLE} selectedIndex={selected} onSelectNode={setSelected} />;
  },
};

export const StateMachineDiff: StoryObj = {
  name: 'State-machine diff',
  render: () => <TaskLanes lanes={AGENT_LANES} />,
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof TaskTimeline> = {
  args: {
    label: 'Task lifecycle', showUnreached: true, selectedIndex: 1,
    nodes: [{ state: 'submitted', at: '09:10:01' }, { state: 'working', at: '09:10:03', connector: '2 s' }, { state: 'completed', at: '09:10:09', connector: '6 s' }],
  },
  argTypes: { onSelectNode: { table: { disable: true } } },
  render: (args) => {
    const [i, setI] = useState(args.selectedIndex);
    return <TaskTimeline {...args} selectedIndex={i} onSelectNode={setI} />;
  },
};
