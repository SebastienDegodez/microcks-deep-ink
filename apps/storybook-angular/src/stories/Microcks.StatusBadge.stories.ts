import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { StatusBadgeComponent } from '@microcks-deep-ink/registry/angular/status-badge';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/StatusBadge',
  decorators: [moduleMetadata({ imports: [StatusBadgeComponent] })],
  parameters: itemParams(['status-badge', 'icon'], "An icon and a word, always. The icon shapes differ (check, cross, triangle, arc, circle), so the status is readable without color."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="di-inline">
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
      <div class="di-inline">
        <span mkStatusBadge size="sm" status="conformant" label="92 % conformant"></span>
        <span mkStatusBadge size="sm" status="failed" label="2 failed"></span>
      </div>
    `,
  }),
};
