import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { createRawSnippet } from 'svelte';
import { SkillList } from '@microcks/deep-ink';
import SkillListStory from './Microcks.SkillList.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/SkillList', component: SkillList, parameters: itemParams(['skill-list','icon'], 'The skills of an A2A Agent Card: id, name, calls in 24 h, tags and the last test result. A selectable list uses `aria-pressed` buttons and leaves the detail to a region next to it. The fallback entry stands for messages no skill matched.') } satisfies Meta<typeof SkillList>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Default = story({ render: (() => ({ Component: SkillListStory, props: { variant: 'Default' } })) as never });
export const Selectable = story({ render: (() => ({ Component: SkillListStory, props: { variant: 'Selectable' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({ args: { label: 'Agent skills', selectedId: 'search', onselectskill: () => undefined, skills: [{id:'search',name:'search_pastries',calls:12,tags:['read'],meta:'GET /pastries',result:'pass'},{id:'order',name:'order_pastry',calls:3,tags:['write'],meta:'POST /orders',result:'fail',resultNote:'Missing quantity'}] }, argTypes: { onselectskill: { table: { disable: true } } } });
