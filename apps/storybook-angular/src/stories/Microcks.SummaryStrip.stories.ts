import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SUMMARY_STRIP } from '@microcks-deep-ink/registry/angular/summary-strip';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/SummaryStrip',
  argTypes: argTypesFor('summary-strip'),
  decorators: [moduleMetadata({ imports: [...SUMMARY_STRIP] })],
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

export const FromContent: StoryObj = {
  name: 'Built from content',
  render: () => ({
    template: `<div mkSummaryStrip style="max-width: 900px"><span class="summary-strip-label">Saved</span><span class="summary-strip-value">URI_PARTS · rule: name</span><span mkSummaryStripSep></span><span class="summary-strip-value">delay 0 ms fixed</span><span mkSummaryStripSep></span><a href="#/behavior">Edit the behaviour</a></div>`,
  }),
};

export const Canvas: StoryObj = {
  name: 'Canvas (Agent test setup)',
  render: () => ({
    props: { parts: [{ text: 'Setup', kind: 'label' }, { text: 'https://agents.acme.io/concierge' }, { text: 'JSON-RPC 2.0', sep: true }] },
    template: `<div mkSummaryStrip role="note" aria-label="Test setup" variant="canvas" style="max-width: 900px" [parts]="parts"></div>`,
  }),
};
