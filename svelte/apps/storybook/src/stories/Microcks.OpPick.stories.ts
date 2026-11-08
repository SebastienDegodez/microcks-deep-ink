import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { OpPickList } from '@microcks/deep-ink';
import OpPickStory from './Microcks.OpPick.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/OpPick', component: OpPickList, parameters: itemParams(['op-pick','method-tag'], 'Operation picker cards. Toggle mode is a list of aria-pressed buttons (Service rail); radio mode is a radiogroup with arrow keys (Copilot).') } satisfies Meta<typeof OpPickList>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const ServiceRail = story({ name: 'Toggle (Service rail)', render: (() => ({ Component: OpPickStory, props: { variant: 'ServiceRail' } })) as never });
export const Copilot = story({ name: 'Radio (Copilot)', render: (() => ({ Component: OpPickStory, props: { variant: 'Copilot' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({ args: { onchange: () => undefined, label: 'Operations to test', mode: 'toggle', value: undefined, options: [{id:'list',method:'GET',path:'/pastries',summary:'List pastries'},{id:'one',method:'GET',path:'/pastries/{name}',summary:'Get one pastry'},{id:'patch',method:'PATCH',path:'/pastries/{name}',summary:'Update a pastry',end:'Retry',endTone:'warning'}] }, argTypes: { mode: { control: 'inline-radio', options: ['toggle','radio'] }, onchange: { table: { disable: true } } } });
