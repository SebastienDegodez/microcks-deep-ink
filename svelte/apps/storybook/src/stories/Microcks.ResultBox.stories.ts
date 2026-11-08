import exampleSource0 from './Microcks.ResultBox.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { createRawSnippet } from 'svelte';
import { ResultBox } from '@microcks/deep-ink';
import ResultBoxStory from './Microcks.ResultBox.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/ResultBox', component: ResultBox, parameters: itemParams(['result-box','button'], 'A framed result line in a role="status" box. Keep it mounted before the result arrives so the text is announced; the tone icon is decorative.') } satisfies Meta<typeof ResultBox>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Tones = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: (() => ({ Component: ResultBoxStory, props: { variant: 'Tones' } })) as never });
/** `tone="warning"`, a custom `icon`, `dismissLabel`, and `live="off"` for a box that is already on screen at load. */
export const WarningDismissible = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'Warning, dismissible, not announced', render: (() => ({ Component: ResultBoxStory, props: { variant: 'WarningDismissible' } })) as never });
/** `bordered={false}` and `surface="raised"`: a flat note on the raised fill, as the Agent test verdict. */
export const FlatRaised = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'Not bordered, raised (verdict)', render: (() => ({ Component: ResultBoxStory, props: { variant: 'FlatRaised' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({
  parameters: { docs: { source: { code: `<script>
  import { ResultBox } from '@microcks/deep-ink';
</script>

<ResultBox tone="success" size="md" title="Test passed" dismissLabel="Dismiss" live="status" bordered surface="surface" density="regular">All 12 operations match the contract.</ResultBox>`, language: 'svelte', type: 'code' } } }, args: { tone: 'success', size: 'md', title: 'Test passed', children: createRawSnippet(() => ({ render: () => 'All 12 operations match the contract.' })), dismissLabel: 'Dismiss', live: 'status', bordered: true, surface: 'surface', density: 'regular' }, argTypes: { tone: { control: 'select', options: ['success','warning','danger','neutral','info'] }, size: { control: 'inline-radio', options: ['sm','md'] }, live: { control: 'inline-radio', options: ['status','off'] }, surface: { control: 'inline-radio', options: ['surface','raised'] }, density: { control: 'inline-radio', options: ['regular','compact'] }, ondismiss: { table: { disable: true } } } });
