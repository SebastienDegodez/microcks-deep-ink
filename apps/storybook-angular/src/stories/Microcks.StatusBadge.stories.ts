import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { StatusBadgeComponent } from '@microcks-deep-ink/registry/angular/status-badge';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Microcks/StatusBadge',
  argTypes: argTypesFor('status-badge', ['StatusBadgeComponent']),
  decorators: [moduleMetadata({ imports: [StatusBadgeComponent] })],
  parameters: itemParams(['status-badge', 'icon'], "An icon and a word, always. The icon shapes differ (check, cross, triangle, arc, circle), so the status is readable without color."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <span mkStatusBadge status="conformant"></span>
        <span mkStatusBadge status="failed"></span>
        <span mkStatusBadge status="partial"></span>
        <span mkStatusBadge status="running"></span>
        <span mkStatusBadge status="never"></span>
      </div>
    `,
  }),
};

export const Small: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <span mkStatusBadge size="sm" status="conformant" label="92 % conformant"></span>
        <span mkStatusBadge size="sm" status="failed" label="2 failed"></span>
      </div>
    `,
  }),
};

export const Bare: StoryObj = {
  name: "Bare (step outcomes)",
  render: () => ({
    template: `
      <div class="inline">
        <span mkStatusBadge shape="bare" status="conformant" label="Passed"></span>
        <span mkStatusBadge shape="bare" status="failed"></span>
        <span mkStatusBadge shape="bare" status="running"></span>
        <span mkStatusBadge shape="bare" status="never" label="Pending"></span>
      </div>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('status-badge', 'StatusBadgeComponent', { status: 'conformant', size: 'md', shape: 'circled' }, '');
