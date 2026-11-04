import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { BarChart, type BarChartBar } from './bar-chart';

const BARS: BarChartBar[] = [
  { id: '116', value: 900, description: 'Run #116, passed, 900 ms', label: '116', tone: 'success' },
  { id: '117', value: 1500, description: 'Run #117, failed, 1.5 s', tone: 'danger', faded: true },
  { id: '118', value: 2700, description: 'Run #118, timed out, 12 s', label: '118', tone: 'warning', cap: '12 s' },
  { id: 'next', value: 0, description: 'Not run yet', future: true },
];

function Chart() {
  const [id, setId] = useState('117');
  return (
    <BarChart
      label="Runs, oldest to newest. Use the arrow keys to move between bars."
      bars={BARS}
      max={3000}
      selectedId={id}
      onSelect={setId}
      ticks={['3 s', '1.5 s', '0']}
      table={{ caption: 'Last 3 runs', columns: ['Run', 'Result'], rows: [['#116', 'Passed'], ['#117', 'Failed'], ['#118', 'Timed out']] }}
    />
  );
}

describe('BarChart', () => {
  it('has one tab stop, moves with the arrow keys, skips future slots and ships a hidden table', async () => {
    const { container } = render(<Chart />);
    const group = screen.getByRole('group', { name: /Runs, oldest to newest/ });
    const bars = screen.getAllByRole('button');
    expect(bars).toHaveLength(3);
    expect(bars.map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    expect(group.contains(bars[0]!)).toBe(true);
    expect(screen.getByRole('button', { name: 'Run #117, failed, 1.5 s' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(bars[1]!, { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Run #118, timed out, 12 s' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Run #118, timed out, 12 s');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Run #118, timed out, 12 s');
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(screen.getByRole('button', { name: 'Run #116, passed, 900 ms' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('table', { name: 'Last 3 runs' }).querySelectorAll('tbody tr')).toHaveLength(3);
    const fill = screen.getByRole('button', { name: 'Run #118, timed out, 12 s' }).firstElementChild as HTMLElement;
    expect(fill.style.height).toBe('90%');
    expect(await axeViolations(container)).toEqual([]);
  });
});
