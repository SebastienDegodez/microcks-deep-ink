import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import PluginSlot from '../plugin-slot/PluginSlot.svelte';
import WorkflowLoom from './WorkflowLoom.svelte';

it('renders both wrappers without browser globals', () => {
  expect(render(PluginSlot, { props: { point: 'nav.items' } }).body).toContain('<plugin-slot');
  expect(render(WorkflowLoom, { props: { label: 'Flow', sources: [], steps: [], threads: [] } }).body).toContain('<workflow-loom');
});
