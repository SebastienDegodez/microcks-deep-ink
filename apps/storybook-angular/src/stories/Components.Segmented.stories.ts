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
