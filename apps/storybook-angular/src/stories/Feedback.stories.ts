import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DEEP_INK, MkStatusBadge } from '@microcks-deep-ink/angular';

const meta: Meta<MkStatusBadge> = {
  title: 'Feedback/StatusBadge',
  component: MkStatusBadge,
  decorators: [moduleMetadata({ imports: [DEEP_INK] })],
  args: { status: 'conformant' },
  render: (args) => ({ props: args, template: `<mk-status-badge [status]="status" [label]="label" [size]="size"></mk-status-badge>` }),
  argTypes: { status: { control: 'select', options: ['conformant', 'failed', 'partial', 'running', 'never'] } },
  parameters: { docs: { description: { component: 'An outcome is always **icon + word + color**, never color alone.' } } },
};
export default meta;
type S = StoryObj<MkStatusBadge>;

export const Playground: S = {};

export const AllOutcomes: S = {
  render: () => ({
    template: `
      <div class="di-stack">
        <mk-status-badge status="conformant"></mk-status-badge>
        <mk-status-badge status="failed"></mk-status-badge>
        <mk-status-badge status="partial"></mk-status-badge>
        <mk-status-badge status="running"></mk-status-badge>
        <mk-status-badge status="never"></mk-status-badge>
      </div>`,
  }),
};

export const Live: S = {
  render: () => ({
    template: `
      <div class="di-col">
        <div class="di-stack">
          <mk-live-indicator></mk-live-indicator>
          <mk-live-indicator label="streaming test"></mk-live-indicator>
        </div>
        <p class="di-note">The pink rule: <code>live</code> marks real-time activity only and is never a status. Failures use coral <code>danger</code> with a ✕ icon.</p>
      </div>`,
  }),
};
