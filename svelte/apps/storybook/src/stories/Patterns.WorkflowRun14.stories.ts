import type { Meta, StoryObj } from '@storybook/svelte-vite';
import WorkflowRun from './Patterns.WorkflowRun14.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Patterns/Workflow run #14', parameters: itemParams(['workflow-loom', 'step-status', 'api-badge', 'run-target', 'run-origin', 'status-badge', 'callout', 'code-block', 'panel'], 'Run #14 of `restock-pastry`, as the Arazzo POC reports it. `patchPastry` passes its success criteria but fails Schema validation because `price` is the string "3.9"; it is retried twice after 1 s and fails after 3 attempts, and `verifyPastry` never runs. Only retry and end actions exist: no goto.', { layout: 'padded' }) } satisfies Meta;
export default meta;
export const Default: StoryObj<typeof meta> = { render: (() => ({ Component: WorkflowRun, props: {} })) as never };
