import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Facts } from '@microcks/deep-ink';
import FactsStory from './Microcks.Facts.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/Facts', component: Facts, parameters: itemParams(['facts'], 'Key/value facts in a native dl. Rows (term column and separators), inline (two-column grid) or columns (term over value). Tones colour a value; the words carry the meaning.') } satisfies Meta<typeof Facts>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Rows = story({ render: (() => ({ Component: FactsStory, props: { variant: 'Rows' } })) as never });
/** Row-level options: `sub` text, `mono` values and a `tone` on `FactRow`, plus the `muted` and `success` tones on `items`. */
export const RowOptions = story({ name: 'Row options (sub, mono, tone)', render: (() => ({ Component: FactsStory, props: { variant: 'RowOptions' } })) as never });
export const Inline = story({ render: (() => ({ Component: FactsStory, props: { variant: 'Inline' } })) as never });
export const Columns = story({ render: (() => ({ Component: FactsStory, props: { variant: 'Columns' } })) as never });
export const SurfaceAndGap = story({ name: 'Boxed on surface, custom gap', render: (() => ({ Component: FactsStory, props: { variant: 'SurfaceAndGap' } })) as never });
export const LargeRows = story({ name: 'Large rows (Service)', render: (() => ({ Component: FactsStory, props: { variant: 'LargeRows' } })) as never });
export const SecondaryRelaxed = story({ name: 'Secondary values, relaxed (Agent test)', render: (() => ({ Component: FactsStory, props: { variant: 'SecondaryRelaxed' } })) as never });
/** Request body (WorkflowRun step): compact frame, 12px/1.6 mono, 32ch term column, pre-wrapped terms and values that break anywhere instead of scrolling. */
export const RequestBody = story({ name: 'Request body (compact, mono, pre-wrap)', render: (() => ({ Component: FactsStory, props: { variant: 'RequestBody' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({ args: { items: [{term:'Service',value:'API Pastry'},{term:'Version',value:'2.0.0',mono:true},{term:'Status',value:'Healthy',tone:'success',sub:'Last check 2 min ago'}], layout:'rows', boxed:false, strong:false, size:'md', termWidth:undefined, columns:undefined, gap:undefined, values:'text', lineHeight:'inherit', mono:false, wrap:'normal' }, argTypes: { layout:{control:'inline-radio',options:['rows','inline','columns']}, boxed:{control:'inline-radio',options:[false,true,'surface','compact']}, size:{control:'inline-radio',options:['sm','md','lg']}, values:{control:'inline-radio',options:['text','secondary']}, lineHeight:{control:'inline-radio',options:['inherit','relaxed']}, wrap:{control:'inline-radio',options:['normal','pre']} } });
