import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { SkillList } from '@microcks-deep-ink/registry/react/skill-list';
import { AGENT_SKILLS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/SkillList',
  component: SkillList,
  parameters: itemParams(['skill-list', 'icon'], 'The skills of an A2A Agent Card: id, name, calls in 24 h, tags and the last test result. A selectable list uses `aria-pressed` buttons and leaves the detail to a region next to it. The fallback entry stands for messages no skill matched.'),
} satisfies Meta<typeof SkillList>;

export const Default: StoryObj = {
  render: () => <SkillList label="Skills of Pastry concierge 1.0" skills={AGENT_SKILLS} />,
};

export const Selectable: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState('order-pastry');
    return (
      <div className="sb-col" style={{ maxWidth: 360 }}>
        <SkillList label="Skills of Pastry concierge 1.0" skills={AGENT_SKILLS} selectedId={selected} onSelectSkill={setSelected} />
        <p role="status">Selected: {selected}</p>
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof SkillList> = {
  args: {
    label: 'Agent skills', selectedId: 'search',
    skills: [
      { id: 'search', name: 'search_pastries', calls: 12, tags: ['read'], meta: 'GET /pastries', result: 'pass' },
      { id: 'order', name: 'order_pastry', calls: 3, tags: ['write'], meta: 'POST /orders', result: 'fail', resultNote: 'Missing quantity' },
    ],
  },
  argTypes: { onSelectSkill: { table: { disable: true } } },
  render: (args) => {
    const [id, setId] = useState(args.selectedId);
    return <SkillList {...args} selectedId={id} onSelectSkill={setId} />;
  },
};
