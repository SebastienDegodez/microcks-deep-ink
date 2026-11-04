import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { TASK_STATES, TaskLanesComponent, TaskStateTagComponent, TaskTimelineComponent } from '@microcks-deep-ink/registry/angular/task-timeline';
import { AGENT_LANES, AGENT_LIFECYCLE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Microcks/TaskTimeline',
  argTypes: argTypesFor('task-timeline', ['TaskLanesComponent', 'TaskStateTagComponent', 'TaskTimelineComponent']),
  decorators: [moduleMetadata({ imports: [TaskStateTagComponent, TaskTimelineComponent, TaskLanesComponent] })],
  parameters: itemParams(['task-timeline', 'icon'], 'The lifecycle of an A2A task. `mkTaskStateTag` writes one state (glyph + word), `mkTaskTimeline` chains them and can select the steps of a script, and `mkTaskLanes` lays the expected and the actual lifecycle side by side. Color never carries the state alone: the word and the glyph shape do.'),
};
export default meta;

export const States: StoryObj = {
  render: () => ({
    props: { states: TASK_STATES },
    template: `
      <div class="inline">
        @for (s of states; track s) {
          <span mkTaskStateTag [state]="s"></span>
        }
      </div>
    `,
  }),
};

/** The terminal states `auth-required`, `canceled` and `rejected`, a ghost tag, a custom `label` and `showUnreached`. */
export const OtherStates: StoryObj = {
  name: 'Other states',
  render: () => ({
    props: { nodes: [{ state: 'submitted', at: '09:10:01' }, { state: 'working', at: '09:10:03', connector: '2 s' }, { state: 'canceled', at: '09:10:05', connector: '2 s' }] },
    template: `
      <div class="stack">
        <div class="inline">
          <span mkTaskStateTag state="auth-required"></span>
          <span mkTaskStateTag state="canceled"></span>
          <span mkTaskStateTag state="rejected"></span>
          <span mkTaskStateTag state="completed" [ghost]="true"></span>
        </div>
        <ol mkTaskTimeline label="Cancelled task" [showUnreached]="false" [nodes]="nodes"></ol>
      </div>
    `,
  }),
};

export const Timeline: StoryObj = {
  render: () => ({
    props: { nodes: AGENT_LIFECYCLE },
    template: `<ol mkTaskTimeline [nodes]="nodes"></ol>`,
  }),
};

export const Selectable: StoryObj = {
  render: () => ({
    props: {
      nodes: AGENT_LIFECYCLE,
      selected: 2 as number | undefined,
      pick(this: { selected: number | undefined }, index: number | undefined) {
        this.selected = index;
      },
    },
    template: `<ol mkTaskTimeline selectable [nodes]="nodes" [selectedIndex]="selected" (nodeSelect)="pick($event)"></ol>`,
  }),
};

export const StateMachineDiff: StoryObj = {
  name: 'State-machine diff',
  render: () => ({
    props: { lanes: AGENT_LANES },
    template: `<div mkTaskLanes [lanes]="lanes"></div>`,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('task-timeline', 'TaskTimelineComponent', { label: 'Task lifecycle', showUnreached: true, nodes: [{ state: 'submitted', at: '09:10:01' }, { state: 'working', at: '09:10:03', connector: '2 s' }, { state: 'completed', at: '09:10:09', connector: '6 s' }] }, '');
