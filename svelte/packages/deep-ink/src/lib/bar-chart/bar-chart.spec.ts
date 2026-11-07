import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import BarChartHarness from '../../../test/fixtures/BarChartHarness.svelte';
import BarChart from './BarChart.svelte';

describe('BarChart', () => {
  it('has one tab stop, moves with the arrow keys, skips future slots and ships a hidden table', async () => {
    const { container } = render(BarChartHarness);
    const group = screen.getByRole('group', { name: /Runs, oldest to newest/ });
    const bars = screen.getAllByRole('button');
    expect(bars).toHaveLength(3);
    expect(bars.map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    expect(group.contains(bars[0]!)).toBe(true);
    expect(screen.getByRole('button', { name: 'Run #117, failed, 1.5 s' }).getAttribute('aria-pressed')).toBe('true');
    await fireEvent.keyDown(bars[1]!, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Run #118, timed out, 12 s' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Run #118, timed out, 12 s');
    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Run #118, timed out, 12 s');
    await fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(screen.getByRole('button', { name: 'Run #116, passed, 900 ms' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('table', { name: 'Last 3 runs' }).querySelectorAll('tbody tr')).toHaveLength(3);
    const fill = screen.getByRole('button', { name: 'Run #118, timed out, 12 s' }).firstElementChild as HTMLElement;
    expect(fill.style.height).toBe('90%');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('selects on click, moves with End and ArrowLeft, ignores other keys, and keeps the selected label marked', async () => {
    const onSelect = vi.fn();
    const bars = [
      { id: 'a', value: 1, description: 'A', label: 'a' },
      { id: 'b', value: 2, description: 'B', label: 'b' },
      { id: 'c', value: 3, description: 'C', label: 'c' },
    ];
    const table = { caption: 'Runs', columns: ['Run'], rows: [['a'], ['b'], ['c']] };
    const overlay = createRawSnippet(() => ({ render: () => '<svg data-overlay=""></svg>' }));
    const { container } = render(BarChart, { props: { label: 'Runs', bars, max: 3, selectedId: 'b', onSelect, table, overlay, height: 120, gap: 2 } });
    const [a, b, c] = screen.getAllByRole('button');
    const root = container.querySelector<HTMLElement>('.bar-chart')!;
    expect([root.style.getPropertyValue('--bar-chart-height'), root.style.getPropertyValue('--bar-chart-gap')]).toEqual(['120px', '2px']);
    expect(container.querySelector('.bar-chart-overlay [data-overlay]')).toBeTruthy();
    expect(container.querySelector('.bar-chart-labels [data-selected]')!.textContent).toBe('b');
    await fireEvent.click(a!);
    expect(onSelect).toHaveBeenLastCalledWith('a');
    await fireEvent.keyDown(b!, { key: 'End' });
    expect([onSelect.mock.lastCall, document.activeElement]).toEqual([['c'], c]);
    await fireEvent.keyDown(c!, { key: 'ArrowLeft' });
    expect([onSelect.mock.lastCall, document.activeElement]).toEqual([['b'], b]);
    const calls = onSelect.mock.calls.length;
    const down = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    b!.dispatchEvent(down);
    expect([onSelect.mock.calls.length, down.defaultPrevented]).toEqual([calls, false]);
    expect(await axeViolations(container)).toEqual([]);
  });
});
