import { render, waitFor } from '@testing-library/svelte';
import { expect, it, vi } from 'vitest';
import WorkflowLoom from './WorkflowLoom.svelte';
import type { WorkflowLoomElement } from './workflow-loom.js';

it('forwards properties and selection details, and removes listeners on unmount', async () => {
  const onstepselect = vi.fn();
  const onlensselect = vi.fn();
  const sources = [{ name: 'api', type: 'openapi' as const, protocol: 'REST' as const, linked: true }];
  const view = render(WorkflowLoom, { props: { sources, steps: [], threads: [], label: 'Workflow', onstepselect, onlensselect } });
  const el = view.container.querySelector('workflow-loom') as WorkflowLoomElement;
  await waitFor(() => expect(el.sources).toEqual(sources));
  expect(el.label).toBe('Workflow');
  el.dispatchEvent(new CustomEvent('mkStepSelect', { detail: { stepId: 'one' } }));
  el.dispatchEvent(new CustomEvent('mkLensSelect', { detail: { id: 'value' } }));
  expect(onstepselect).toHaveBeenCalledWith({ stepId: 'one' });
  expect(onlensselect).toHaveBeenCalledWith({ id: 'value' });
  view.unmount();
  el.dispatchEvent(new CustomEvent('mkStepSelect', { detail: {} }));
  expect(onstepselect).toHaveBeenCalledTimes(1);
});
