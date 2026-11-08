import exampleSource0 from './Microcks.RunMeta/Default.svelte?raw';
import DefaultExample from './Microcks.RunMeta/Default.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { RunMeta } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunMeta',
  component: RunMeta,
  parameters: itemParams(['run-meta'], 'The meta line under a run header (TestRun, AgentTestRun, WorkflowRun): muted keys and their values in a native `<dl>`, wrapping on narrow screens.'),
} satisfies Meta<typeof RunMeta>;

export const Default: StoryObj = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunMeta> = {
  parameters: { docs: { source: { code: `<script>
  import { RunMeta } from '@microcks/deep-ink';
</script>

<RunMeta items={[{"term":"Started","value":"2026-11-03 09:10"},{"term":"Endpoint","value":"http://pastry:8080/rest/API+Pastry/2.0.0","kind":"url"},{"term":"Runner","value":"OPEN_API_SCHEMA","kind":"mono"},{"term":"Origin","value":"CI","kind":"chip","detail":"GitHub Actions"}]} />`, language: 'svelte', type: 'code' } } },
  args: {
    items: [
      { term: 'Started', value: '2026-11-03 09:10' },
      { term: 'Endpoint', value: 'http://pastry:8080/rest/API+Pastry/2.0.0', kind: 'url' },
      { term: 'Runner', value: 'OPEN_API_SCHEMA', kind: 'mono' },
      { term: 'Origin', value: 'CI', kind: 'chip', detail: 'GitHub Actions' },
    ],
  },
};
