import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { TASK_STATES, TaskLanes, TaskStateTag, TaskTimeline } from '@microcks-deep-ink/registry/react/task-timeline';
import { AGENT_LANES, AGENT_LIFECYCLE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/TaskTimeline',
  parameters: itemParams(['task-timeline', 'icon'], 'The lifecycle of an A2A task. `TaskStateTag` writes one state (glyph + word), `TaskTimeline` chains them and can select the steps of a script, and `TaskLanes` lays the expected and the actual lifecycle side by side. Color never carries the state alone: the word and the glyph shape do.'),
} satisfies Meta;

export const States: StoryObj = {
  render: () => (
    <div className="inline">
      {TASK_STATES.map((s) => (
        <TaskStateTag key={s} state={s} />
      ))}
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
