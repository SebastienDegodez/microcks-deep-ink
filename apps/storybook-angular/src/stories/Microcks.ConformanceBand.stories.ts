import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ConformanceBandComponent } from '@microcks-deep-ink/registry/angular/conformance-band';
import { CONFORMANCE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/ConformanceBand',
  decorators: [moduleMetadata({ imports: [ConformanceBandComponent] })],
  parameters: itemParams(['conformance-band'], "One segment per operation. The band is `role=\"img\"` with a sentence (\"11 of 12 operations pass, 1 fails\"). Failed segments are hatched as well as colored, and the full size writes the summary."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { outcomes: CONFORMANCE },
    template: `
<mk-conformance-band [outcomes]="outcomes" />
    `,
  }),
};

export const Mini: StoryObj = {
  render: () => ({
    props: { outcomes: CONFORMANCE, partial: ['pass', 'pass', 'untested', 'untested'] },
    template: `
      <div class="inline">
        <mk-conformance-band size="mini" [outcomes]="outcomes" />
        <mk-conformance-band size="mini" [outcomes]="partial" />
      </div>
    `,
  }),
};

export const Failing: StoryObj = {
  render: () => ({
    props: { outcomes: ['pass', 'fail', 'fail', 'pass', 'untested', 'fail'] },
    template: `
<mk-conformance-band [outcomes]="outcomes" />
    `,
  }),
};

export const Labelled: StoryObj = {
  name: "Labels under each cell",
  render: () => ({
    props: { outcomes: ['pass', 'pass', 'fail'], labels: ['GET /pastries · passed', 'GET /pastries/{name} · passed', 'PATCH /pastries/{name} · failed'] },
    template: `<mk-conformance-band [outcomes]="outcomes" [labels]="labels" />`,
  }),
};

export const WithSummary: StoryObj = {
  name: "With summary",
  render: () => ({
    props: { outcomes: CONFORMANCE },
    template: `<mk-conformance-band [outcomes]="outcomes" [showSummary]="true" />`,
  }),
};
