import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SummaryStripComponent } from '@microcks-deep-ink/registry/angular/summary-strip';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/SummaryStrip',
  argTypes: argTypesFor('summary-strip', ['SummaryStripComponent']),
  decorators: [moduleMetadata({ imports: [SummaryStripComponent] })],
  parameters: itemParams(['summary-strip'], 'Key facts in one bordered row, separated by decorative 1px rules. The words carry the meaning; add role="note" for a page summary.'),
};
export default meta;

export const Saved: StoryObj = {
  render: () => ({
    props: {
      parts: [
        { text: 'Saved', kind: 'label' },
        { text: 'URI_PARTS · rule: name' },
        { text: 'delay 0 ms fixed', sep: true },
        { text: '2 constraints', sep: true },
        { text: '3 examples · dispatcher inferred from the OpenAPI path parameter', kind: 'label', sep: true },
      ],
    },
    template: `<div mkSummaryStrip role="note" aria-label="Saved behaviour" style="max-width: 900px" [parts]="parts"></div>`,
  }),
};

export const Dispatcher: StoryObj = {
  name: 'Dispatcher summary (values in text)',
  render: () => ({
    props: { parts: [{ text: 'Dispatcher', kind: 'label' }, { text: 'URI_PARTS' }, { text: 'name', sep: true }] },
    template: `<div mkSummaryStrip gap="roomy" values="text" style="max-width: 900px" [parts]="parts"><a href="#/behavior">Edit the behaviour</a></div>`,
  }),
};
