import exampleSource0 from './Elements.WorkflowLoom.svelte?raw';
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
export const Default = { ...(story('Default', 'Run #14 (restock-pastry)')), parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } } };
/** A session run: each node lists generic checks (`checks: { label, state }[]`): Call #N, Data passing, Contract. */
export const SessionChecks = { ...(story('SessionChecks', 'Session run #13 (generic checks)')), parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } } };
/** On a page that already has a Steps tab, `tableToggle={false}` hides the built-in "Show as table" button. */
export const WithoutTableToggle = { ...(story('WithoutTableToggle', 'Without the table toggle')), parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } } };
/** Three independent reads run in parallel (dependsOn) and join at compareSizes. */
export const CheckMenu = { ...(story('CheckMenu', 'Parallel branches (check-menu)')), parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } } };
/** A design-time view: no run, so no statuses and no checks. */
export const DesignTime = { ...(story('DesignTime', 'Design time (no run)')), parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } } };
export const NotLinked = { ...(story('NotLinked', 'Source not linked')), parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } } };
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = {
  parameters: { docs: { source: { code: `<script>
  import { WorkflowLoom } from '@microcks/deep-ink';
</script>

<WorkflowLoom label="restock-pastry, run #14" validatesSchemas inputs={[{"name":"size","value":"\\"M\\""},{"name":"newPrice","value":"3.9"}]} outputs={[{"name":"pastryName"},{"name":"oldPrice"},{"name":"newPrice"}]} outputNote="No outputs: #14 failed." sources={[{"name":"apiPastry","type":"openapi","protocol":"REST","linked":true,"serviceLabel":"API Pastry 2.0"}]} steps={[{"stepId":"listPastries","source":"apiPastry","operation":"GET /pastries","status":"passed","attempts":1,"result":"200 · 212 ms","checks":{"successCriteria":"passed","schemaValidation":"passed"}},{"stepId":"getPastry","source":"apiPastry","operation":"GET /pastries/{name}","status":"passed","attempts":1,"result":"200 · 188 ms","checks":{"successCriteria":"passed","schemaValidation":"passed"},"actions":[{"type":"end","name":"alreadyAvailable","on":"success","criteria":"$response.body#/status == 'available'","label":"status == 'available'","runLabel":"#14","taken":false}]},{"stepId":"patchPastry","source":"apiPastry","operation":"PATCH /pastries/{name}","status":"failed","attempts":3,"result":"200 · 3 attempts · 5.4 s","checks":{"successCriteria":"passed","schemaValidation":"failed"},"actions":[{"type":"retry","name":"retryPatch","on":"failure","retryAfter":1,"retryLimit":2,"applied":true,"runLabel":"#14"}]},{"stepId":"verifyPastry","source":"apiPastry","operation":"GET /pastries/{name}","status":"not-run","result":"Not run","checks":{"successCriteria":"not-evaluated","schemaValidation":"not-evaluated"}}]} threads={[{"id":"size","from":"$inputs","expression":"$inputs.size","value":"\\"M\\"","drops":[{"to":"listPastries","label":"size · query"}]},{"id":"firstName","from":"listPastries","expression":"$steps.listPastries.outputs.firstName","value":"\\"Eclair Cafe\\"","drops":[{"to":"getPastry","label":"name · path"},{"to":"patchPastry","label":"name · path"},{"to":"verifyPastry","label":"name · path","idle":true},{"to":"$outputs","label":"pastryName","idle":true}]},{"id":"newPriceIn","from":"$inputs","expression":"$inputs.newPrice","value":"3.9","drops":[{"to":"patchPastry","label":"/price · body"}]},{"id":"oldPrice","from":"getPastry","expression":"$steps.getPastry.outputs.oldPrice","value":"2.4","drops":[{"to":"$outputs","label":"oldPrice","idle":true}]},{"id":"newPrice","from":"patchPastry","expression":"$steps.patchPastry.outputs.newPrice","missing":true,"drops":[{"to":"$outputs","label":"newPrice","idle":true}]}]} selectedStep="patchPastry" tableToggle />`, language: 'svelte', type: 'code' } } }, args: { ...LOOM_RESTOCK_RUN14, selectedStep: 'patchPastry', tableToggle: true } } as Story;
/** Same scenario as the Angular `Run14` story. */
export const Run14 = { ...(story('Run14', 'Run #14 (retry and failed step)')), parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } } };
