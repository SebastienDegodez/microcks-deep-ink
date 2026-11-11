import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import BarChart from './BarChart.svelte';
import type { BarChartBar } from './types.js';
const bars: BarChartBar[] = [
  { id: '116', value: 900, description: 'Run #116, passed, 900 ms', label: '116', tone: 'success' },
  { id: '117', value: 1500, description: 'Run #117, failed, 1.5 s', tone: 'danger', faded: true },
  { id: '118', value: 2700, description: 'Run #118, timed out, 12 s', label: '118', tone: 'warning', cap: '12 s' },
  { id: 'next', value: 0, description: 'Not run yet', future: true },
];
const table = { caption: 'Last 3 runs', columns: ['Run', 'Result'], rows: [['#116', 'Passed'], ['#117', 'Failed'], ['#118', 'Timed out']] };
describe('BarChart', () => {
  it('has one tab stop, arrow navigation skipping future slots and a hidden table', async () => {
    const onselect = vi.fn();
    const { container, rerender } = render(BarChart, { label: 'Runs, oldest to newest. Use the arrow keys to move between bars.', bars, max: 3000, selectedId: '117', onselect, ticks: ['3 s','1.5 s','0'], table });
    const buttons = screen.getAllByRole<HTMLButtonElement>('button');
    expect(buttons).toHaveLength(3);
    expect(buttons.map(b => b.tabIndex)).toEqual([-1,0,-1]);
    expect(screen.getByRole('group', { name: /Runs, oldest to newest/ }).contains(buttons[0]!)).toBe(true);
    expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true');
    await fireEvent.keyDown(buttons[1]!, { key: 'ArrowRight' });
    expect(onselect).toHaveBeenLastCalledWith('118');
    expect(document.activeElement).toBe(buttons[2]);
    await rerender({ selectedId: '118' });
    expect(buttons[2]!.getAttribute('aria-pressed')).toBe('true');
    await fireEvent.keyDown(buttons[2]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[2]);
    await fireEvent.keyDown(buttons[2]!, { key: 'Home' });
    expect(onselect).toHaveBeenLastCalledWith('116');
    expect(document.activeElement).toBe(buttons[0]);
    await fireEvent.keyDown(buttons[0]!, { key: 'End' });
    expect(document.activeElement).toBe(buttons[2]);
    await fireEvent.keyDown(buttons[2]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(buttons[1]);
    await fireEvent.click(buttons[0]!);
    expect(onselect).toHaveBeenLastCalledWith('116');
    expect(screen.getByRole('table', { name: 'Last 3 runs' }).querySelectorAll('tbody tr')).toHaveLength(3);
    expect((buttons[2]!.firstElementChild as HTMLElement).style.height).toBe('90%');
    expect(await axeViolations(container)).toEqual([]);
  }, 15000);
  it('uses the last available bar as the default tab stop and clamps heights', () => {
    const { container } = render(BarChart, { label: 'Runs', bars: [{id:'a',value:0,description:'zero'},{id:'b',value:0.01,description:'tiny'},{id:'c',value:4000,description:'capped'}], max:3000, onselect:vi.fn(), table, height:200, gap:6, minHeight:4 });
    expect(screen.getAllByRole<HTMLButtonElement>('button').map(b=>b.tabIndex)).toEqual([-1,-1,0]);
    expect(Array.from(container.querySelectorAll<HTMLElement>('.bar-chart-fill')).map(el=>el.style.height)).toEqual(['0%','4%','100%']);
    expect(container.querySelector<HTMLElement>('.bar-chart')?.style.getPropertyValue('--bar-chart-height')).toBe('200px');
    expect(container.querySelector<HTMLElement>('.bar-chart')?.style.getPropertyValue('--bar-chart-gap')).toBe('6px');
  });
  it('renders no style attribute without a size variable', () => {
    const { container } = render(BarChart, { label: 'Runs', bars, max: 3000, onselect: vi.fn(), table });
    expect(container.querySelector('.bar-chart')?.hasAttribute('style')).toBe(false);
  });
  it('supports an empty group and a nonpositive maximum', async () => {
    const { container, rerender } = render(BarChart, { label:'Runs',bars:[],max:0,onselect:vi.fn(),table });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    await rerender({ bars });
    expect(container.querySelector<HTMLElement>('.bar-chart-fill')?.style.height).toBe('0%');
  });
});
