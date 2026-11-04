import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SegmentedComponent } from '@microcks-deep-ink/registry/angular/segmented';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Segmented',
  argTypes: argTypesFor('segmented', ['SegmentedComponent']),
  decorators: [moduleMetadata({ imports: [SegmentedComponent] })],
  parameters: itemParams(['segmented'], "A group of toggle buttons with `aria-pressed`, for filters such as All, Passed and Failed. Announce the result count elsewhere with a live region."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: {
      v: 'all',
      options: [
        { id: 'all', label: 'All', count: 27 },
        { id: 'passed', label: 'Passed', count: 25 },
        { id: 'failed', label: 'Failed', count: 2 },
      ],
    },
    template: `
<mk-segmented label="Filter test results" [options]="options" [(value)]="v" />
    `,
  }),
};

export const DotsAndIcons: StoryObj = {
  name: "Dots and icons",
  render: () => ({
    props: {
      r: 'all',
      view: 'table',
      results: [
        { id: 'all', label: 'All', count: 11, dot: 'neutral' },
        { id: 'ok', label: 'Conformant', count: 3, dot: 'success' },
        { id: 'ko', label: 'Failing', count: 5, dot: 'danger' },
        { id: 'never', label: 'Never tested', count: 3, dot: 'muted' },
      ],
      views: [
        { id: 'table', label: 'Table', icon: 'list' },
        { id: 'wall', label: 'Badge wall', icon: 'badge-wall' },
      ],
    },
    template: `
      <div class="inline">
        <mk-segmented label="Last test" [options]="results" [(value)]="r" />
        <mk-segmented label="View" [options]="views" [(value)]="view" />
      </div>
    `,
  }),
};

export const Joined: StoryObj = {
  render: () => ({
    props: { v: 'groovy', options: [{ id: 'groovy', label: 'Groovy' }, { id: 'js', label: 'JavaScript' }] },
    template: `<mk-segmented label="Script language" variant="joined" [options]="options" [(value)]="v" />`,
  }),
};

export const JoinedPrimary: StoryObj = {
  name: "Joined, primary tone",
  render: () => ({
    props: { v: 'primary', options: [{ id: 'primary', label: 'Primary' }, { id: 'secondary', label: 'Secondary' }] },
    template: `<mk-segmented label="Artifact role" variant="joined" tone="primary" [options]="options" [(value)]="v" />`,
  }),
};

export const StatusIcons: StoryObj = {
  name: 'Toned icons, selected fill (Sources)',
  render: () => ({
    props: {
      v: 'all',
      options: [
        { id: 'all', label: 'All' },
        { id: 'imported', label: 'Imported', icon: 'check', iconTone: 'success' },
        { id: 'warnings', label: 'Warnings', icon: 'warning', iconTone: 'warning' },
        { id: 'failing', label: 'Failing', icon: 'cross', iconTone: 'danger' },
        { id: 'inactive', label: 'Inactive', icon: 'pause', iconTone: 'muted' },
      ],
    },
    template: `<mk-segmented label="Status" pressedFill="selected" [iconSize]="13" [options]="options" [(value)]="v" />`,
  }),
};

export const Compact: StoryObj = {
  name: 'Joined sm and wide track (Behavior, Usage)',
  render: () => ({
    props: {
      lang: 'groovy',
      period: 'today',
      langs: [{ id: 'groovy', label: 'Groovy' }, { id: 'js', label: 'JavaScript' }],
      periods: [{ id: 'today', label: 'Today' }, { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }],
    },
    template: `<div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start"><mk-segmented label="Script language" variant="joined" size="sm" [options]="langs" [(value)]="lang" /><mk-segmented label="Period" spacing="wide" [options]="periods" [(value)]="period" /></div>`,
  }),
};
