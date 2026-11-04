import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { RunMetaComponent } from '@microcks-deep-ink/registry/angular/run-meta';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/RunMeta',
  argTypes: argTypesFor('run-meta', ['RunMetaComponent']),
  decorators: [moduleMetadata({ imports: [RunMetaComponent] })],
  parameters: itemParams(['run-meta'], 'The meta line under a run header (TestRun, AgentTestRun, WorkflowRun): muted keys and their values in a native `<dl>`, wrapping on narrow screens.'),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: {
      items: [
        { term: 'Endpoint', value: 'https://concierge.acme.io/a2a', kind: 'url' },
        { term: 'Runner', value: 'A2A_CONFORMANCE', kind: 'chip' },
        { term: 'Started', value: 'just now', detail: 'Nov 3, 2026 14:12:08' },
        { term: 'Duration', value: '4.2 s', kind: 'mono' },
        { term: 'Launched by', value: 'MA' },
      ],
    },
    template: `<dl mkRunMeta [items]="items"></dl>`,
  }),
};
