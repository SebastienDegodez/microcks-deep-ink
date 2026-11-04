import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { WorkflowLoom, type LoomSource, type LoomStep, type LoomThread, type WorkflowLoomProps } from './workflow-loom';

const sources: LoomSource[] = [{ name: 'apiPastry', type: 'openapi', protocol: 'REST', linked: true, serviceLabel: 'API Pastry 2.0' }];
const steps: LoomStep[] = [
  { stepId: 'listPastries', source: 'apiPastry', operation: 'GET /pastries', status: 'passed', result: '200 · 212 ms' },
  { stepId: 'patchPastry', source: 'apiPastry', operation: 'PATCH /pastries/{name}', status: 'failed', attempts: 3 },
];
const threads: LoomThread[] = [
  { id: 'size', from: '$inputs', expression: '$inputs.size', value: '"M"', drops: [{ to: 'listPastries', label: 'size · query' }] },
  { id: 'firstName', from: 'listPastries', expression: '$steps.listPastries.outputs.firstName', drops: [{ to: 'patchPastry', label: 'name · path' }, { to: '$outputs', label: 'pastryName' }] },
];

async function mount(props: Partial<WorkflowLoomProps> = {}) {
  const view = render(
    <WorkflowLoom label="restock-pastry" sources={sources} steps={steps} threads={threads} inputs={[{ name: 'size', value: '"M"' }]} outputs={['pastryName']} {...props} />,
  );
  const el = view.container.querySelector('workflow-loom') as HTMLElement;
  await waitFor(() => expect(el.shadowRoot?.querySelector('button.node')).toBeTruthy());
  const root = el.shadowRoot!;
  const button = (name: string | RegExp) => {
    const all = [...root.querySelectorAll('button')];
    const found = all.find((b) => {
      const text = b.getAttribute('aria-label') ?? b.textContent ?? '';
      return typeof name === 'string' ? text.replace(/\s+/g, ' ').trim().startsWith(name) : name.test(text);
    });
    if (!found) throw new Error(`no button ${String(name)} in ${all.map((b) => b.textContent).join(' | ')}`);
    return found;
  };
  const settle = () => waitFor(() => Promise.resolve());
  return { el, root, button, settle, ...view };
}

describe('WorkflowLoom element', () => {
  it('emits mkLensSelect from an input, then clears it on a second press', async () => {
    const onLensSelect = vi.fn();
    const { button } = await mount({ onLensSelect });
    const input = button('Trace workflow input $inputs.size');
    input.click();
    expect(onLensSelect).toHaveBeenLastCalledWith({ id: 'size', expression: '$inputs.size' });
    await waitFor(() => expect(button('Trace workflow input $inputs.size').getAttribute('aria-pressed')).toBe('true'));
    expect(button('Trace $inputs.size').getAttribute('aria-pressed')).toBe('true');
    button('Trace workflow input $inputs.size').click();
    expect(onLensSelect).toHaveBeenLastCalledWith({ id: undefined, expression: undefined });
  });

  it('maps an output to the thread that feeds it, and traces a thread label', async () => {
    const onLensSelect = vi.fn();
    const { button } = await mount({ onLensSelect });
    button('Trace workflow output pastryName').click();
    expect(onLensSelect).toHaveBeenLastCalledWith({ id: 'firstName', expression: '$steps.listPastries.outputs.firstName' });
    await waitFor(() => expect(button('Trace $steps.listPastries.outputs.firstName').getAttribute('aria-pressed')).toBe('true'));
    button('Trace $inputs.size').click();
    expect(onLensSelect).toHaveBeenLastCalledWith({ id: 'size', expression: '$inputs.size' });
  });

  it('follows the lens prop', async () => {
    const { button } = await mount({ lens: 'firstName' });
    await waitFor(() => expect(button('Trace $steps.listPastries.outputs.firstName').getAttribute('aria-pressed')).toBe('true'));
    expect(button('Trace $inputs.size').getAttribute('aria-pressed')).toBe('false');
  });

  it('selects a step, and clears the selection when the selected step is pressed again', async () => {
    const onStepSelect = vi.fn();
    const { button } = await mount({ onStepSelect, selectedStep: 'patchPastry' });
    button('Step 1, listPastries').click();
    expect(onStepSelect).toHaveBeenLastCalledWith({ stepId: 'listPastries' });
    await waitFor(() => expect(button('Step 1, listPastries').getAttribute('aria-pressed')).toBe('true'));
    button('Step 1, listPastries').click();
    expect(onStepSelect).toHaveBeenLastCalledWith({ stepId: undefined });
  });

  it('names a node with its number, method, path, status and result', async () => {
    const { button } = await mount();
    expect(button('Step 1').getAttribute('aria-label')).toBe('Step 1, listPastries, GET /pastries, Passed, 200 · 212 ms');
    expect(button('Step 2').getAttribute('aria-label')).toBe('Step 2, patchPastry, PATCH /pastries/{name}, Failed after 3 attempts');
  });

  it('shows "Show as table" by default and hides it with tableToggle={false}', async () => {
    const shown = await mount();
    const toggle = shown.button('Show as table');
    toggle.click();
    await waitFor(() => expect(shown.root.querySelector('table')).toBeTruthy());
    shown.unmount();

    const hidden = await mount({ tableToggle: false });
    expect([...hidden.root.querySelectorAll('button')].some((b) => b.textContent?.includes('Show as table'))).toBe(false);
    expect(hidden.root.querySelector('table')).toBeNull();
  });

  it('still accepts the legacy string inputs and one-consumer threads', async () => {
    const { root, button } = await mount({
      inputs: ['size'],
      threads: [
        { from: '$inputs', to: 'listPastries', expression: '$inputs.size' },
        { from: 'listPastries', to: 'patchPastry', expression: '$steps.listPastries.outputs.firstName' },
        { from: 'listPastries', to: '$outputs', expression: '$steps.listPastries.outputs.firstName' },
      ],
    });
    expect(button('Trace workflow input $inputs.size')).toBeTruthy();
    expect(root.querySelectorAll('li.thr')).toHaveLength(2);
    expect(root.querySelectorAll('.drop')).toHaveLength(3);
  });
});
