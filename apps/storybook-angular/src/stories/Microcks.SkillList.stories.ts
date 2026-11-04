import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SkillListComponent } from '@microcks-deep-ink/registry/angular/skill-list';
import { AGENT_SKILLS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/SkillList',
  argTypes: argTypesFor('skill-list', ['SkillListComponent']),
  decorators: [moduleMetadata({ imports: [SkillListComponent] })],
  parameters: itemParams(['skill-list', 'icon'], 'The skills of an A2A Agent Card: id, name, calls in 24 h, tags and the last test result. A selectable list uses `aria-pressed` buttons and leaves the detail to a region next to it. The fallback entry stands for messages no skill matched.'),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { skills: AGENT_SKILLS },
    template: `<ul mkSkillList label="Skills of Pastry concierge 1.0" [skills]="skills"></ul>`,
  }),
};

export const Selectable: StoryObj = {
  render: () => ({
    props: {
      skills: AGENT_SKILLS,
      selected: 'order-pastry',
      pick(this: { selected: string }, id: string) {
        this.selected = id;
      },
    },
    template: `
      <div class="sb-col" style="max-width: 360px">
        <ul mkSkillList selectable label="Skills of Pastry concierge 1.0" [skills]="skills" [selectedId]="selected" (skillSelect)="pick($event)"></ul>
        <p role="status">Selected: {{ selected }}</p>
      </div>
    `,
  }),
};
