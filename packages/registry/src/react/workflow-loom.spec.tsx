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
      const text = b.textContent ?? '';
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
    button('Step 1 listPastries').click();
    expect(onStepSelect).toHaveBeenLastCalledWith({ stepId: 'listPastries' });
    await waitFor(() => expect(button('Step 1 listPastries').getAttribute('aria-pressed')).toBe('true'));
    button('Step 1 listPastries').click();
    expect(onStepSelect).toHaveBeenLastCalledWith({ stepId: undefined });
  });

  it('names a node from its visible content (number, id, method, path, status, checks, result)', async () => {
    const { button } = await mount({ validatesSchemas: true });
    const name = (b: HTMLElement) => (b.textContent ?? '').replace(/\s+/g, ' ').trim();
    const first = button('Step 1');
    expect(first.hasAttribute('aria-label')).toBe(false);
    expect(name(first)).toBe('Step 1 listPastries GET /pastries Passed Success criteria not evaluated Schema validation not evaluated 200 · 212 ms');
    expect(name(button('Step 2'))).toMatch(/^Step 2 patchPastry PATCH \/pastries\/\{name\} Failed after 3 attempts/);
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

  it('gives a row with a bad drop room for the wrapped "got" label', async () => {
    const { root } = await mount({
      threads: [{ id: 'firstName', from: 'listPastries', expression: '$steps.listPastries.outputs.firstName', drops: [{ to: 'patchPastry', label: 'name · path', bad: 'Millefeuille' }] }],
    });
    const bad = root.querySelector('.drop.bad');
    expect(bad?.textContent).toContain('name · path · got Millefeuille');
    expect(bad?.closest('li')?.classList.contains('tall')).toBe(true);
  });

  it('draws generic check rows (session run) with their spoken state', async () => {
    const { button } = await mount({
      steps: [
        { ...steps[0]!, checks: [{ label: 'Call #2', state: 'pass' }, { label: 'Data passing', state: 'fail' }, { label: 'Contract', state: 'skip' }] },
        steps[1]!,
      ],
    });
    const text = (button('Step 1').textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toContain('Call #2 passed Data passing failed Contract skipped');
  });

  it('puts the inputs, then the steps, then the outputs in the Tab order', async () => {
    const { root } = await mount();
    const order = [...root.querySelectorAll<HTMLButtonElement>('button')]
      .filter((b) => b.tabIndex >= 0)
      .map((b) => (b.textContent ?? '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 4).join(' '));
    const at = (prefix: string) => order.findIndex((t) => t.startsWith(prefix));
    expect(at('Trace workflow input')).toBeGreaterThanOrEqual(0);
    expect(at('Trace workflow input')).toBeLessThan(at('Step 1'));
    expect(at('Step 1')).toBeLessThan(at('Trace workflow output'));
  });

  it('focuses a node through focusStep()', async () => {
    const { el, root } = await mount();
    const loom = el as HTMLElement & { focusStep(id: string): Promise<boolean> };
    await expect(loom.focusStep('patchPastry')).resolves.toBe(true);
    expect((root.activeElement?.textContent ?? '').replace(/\s+/g, ' ')).toContain('Step 2 patchPastry');
    await expect(loom.focusStep('nope')).resolves.toBe(false);
  });

  it('lists the inputs before and the outputs after the table in the table view', async () => {
    const { root, button } = await mount({ outputNote: 'No outputs: #14 failed.' });
    button('Show as table').click();
    await waitFor(() => expect(root.querySelector('table')).toBeTruthy());
    const blocks = [...root.querySelectorAll('.io-line, .table-wrap')].map((n) => (n.classList.contains('table-wrap') ? 'table' : n.firstElementChild?.textContent));
    expect(blocks).toEqual(['Inputs', 'table', 'Outputs']);
  });
});

