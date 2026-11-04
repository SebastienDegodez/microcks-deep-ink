import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SkeletonComponent } from '@microcks-deep-ink/registry/angular/skeleton';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Components/Skeleton',
  argTypes: argTypesFor('skeleton', ['SkeletonComponent']),
  decorators: [moduleMetadata({ imports: [SkeletonComponent] })],
  parameters: itemParams(['skeleton'], "Placeholder lines, hidden from assistive technology. The container sets `aria-busy` and a status message says what loads. Static under reduced motion."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div aria-busy="true" style="max-width:420px">
        <p class="sr-only" role="status">Loading services</p>
        <span mkSkeleton [lines]="3"></span>
      </div>
    `,
  }),
};

/** `width` sets the width of the last line or of a single block. */
export const Widths: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" aria-busy="true" style="max-width:480px">
        <span mkSkeleton width="120px"></span>
        <span mkSkeleton [lines]="3" width="70%"></span>
      </div>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('skeleton', 'SkeletonComponent', { lines: 3, width: '60%' }, '');
