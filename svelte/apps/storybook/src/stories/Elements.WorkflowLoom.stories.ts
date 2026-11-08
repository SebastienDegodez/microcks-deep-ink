import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { WorkflowLoom } from '@microcks/deep-ink';
import { LOOM_RESTOCK_RUN14 } from '@microcks-deep-ink/storybook-shared/fixtures';
import Loom from './Elements.WorkflowLoom.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Elements/WorkflowLoom', component: WorkflowLoom, parameters: itemParams(['workflow-loom', 'step-status'], 'Draws an Arazzo workflow: one lane per source, steps placed by `dependsOn` depth, threads for data, and only two action kinds, **retry** and **end** (no goto). Steps are buttons you move between with the arrow keys; **Show as table** swaps the drawing for an equivalent table. `<workflow-loom>` is a Web Component: the item copies a self-contained bundle plus a thin wrapper.', { layout: 'padded' }) } satisfies Meta<typeof WorkflowLoom>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = (variant: string, name: string): Story => ({ name, render: () => ({ Component: Loom, props: { variant } }) }) as unknown as Story;
/** Run #14 of restock-pastry: patchPastry fails Schema validation (price is the string "3.9"); verifyPastry did not run. */
export const Default = story('Default', 'Run #14 (restock-pastry)');
/** A session run: each node lists generic checks (`checks: { label, state }[]`): Call #N, Data passing, Contract. */
export const SessionChecks = story('SessionChecks', 'Session run #13 (generic checks)');
/** On a page that already has a Steps tab, `tableToggle={false}` hides the built-in "Show as table" button. */
export const WithoutTableToggle = story('WithoutTableToggle', 'Without the table toggle');
/** Three independent reads run in parallel (dependsOn) and join at compareSizes. */
export const CheckMenu = story('CheckMenu', 'Parallel branches (check-menu)');
/** A design-time view: no run, so no statuses and no checks. */
export const DesignTime = story('DesignTime', 'Design time (no run)');
export const NotLinked = story('NotLinked', 'Source not linked');
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = { args: { ...LOOM_RESTOCK_RUN14, selectedStep: 'patchPastry', tableToggle: true } } as Story;
/** Same scenario as the Angular `Run14` story. */
export const Run14 = story('Run14', 'Run #14 (retry and failed step)');
