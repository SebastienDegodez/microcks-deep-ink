import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SegmentedComponent } from '@microcks-deep-ink/registry/angular/segmented';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Segmented',
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
