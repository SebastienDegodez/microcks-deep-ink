// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ConformanceBand, conformanceLabel } from './conformance-band';

afterEach(cleanup);

const twelve = [...Array(11).fill('pass'), 'fail'] as ('pass' | 'fail')[];

describe('ConformanceBand', () => {
  it('spells out the counts in the accessible label', () => {
    render(<ConformanceBand outcomes={twelve} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('11 of 12 operations pass, 1 fails');
  });

  it('handles plurals, untested operations and empty input', () => {
    expect(conformanceLabel(['pass', 'fail', 'fail', 'untested'])).toBe('1 of 4 operations pass, 2 fail, 1 untested');
    expect(conformanceLabel(['pass'])).toBe('1 of 1 operation pass');
    expect(conformanceLabel([])).toBe('No operations');
  });

  it('counts skills for an A2A agent', () => {
    expect(conformanceLabel(['pass', 'fail', 'fail'], 'skill')).toBe('1 of 3 skills pass, 2 fail');
    render(<ConformanceBand outcomes={['pass', 'fail']} unit="skill" size="mini" />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('1 of 2 skills pass, 1 fails');
  });

  it('writes the score and counts as visible text when asked', () => {
    const { container } = render(<ConformanceBand outcomes={twelve} showSummary />);
    const summary = container.querySelector('.conformance-summary');
    expect(summary?.textContent).toContain('92%');
    expect(summary?.textContent).toContain('11 of 12 operations pass, 1 fails');
  });

  it('renders one cell per operation and no summary in the mini size', () => {
    const { container } = render(<ConformanceBand outcomes={['pass', 'untested', 'fail']} size="mini" />);
    expect(container.querySelectorAll('[data-result]')).toHaveLength(3);
    expect(container.querySelector('.conformance-summary')).toBeNull();
  });

  it('has no summary by default', () => {
    const { container } = render(<ConformanceBand outcomes={twelve} />);
    expect(container.querySelector('.conformance-summary')).toBeNull();
  });

  it('writes a label under each cell as a named list', () => {
    render(<ConformanceBand outcomes={['pass', 'fail']} labels={['GET /pastries · passed', 'PATCH /pastries/{name} · failed']} />);
    const list = screen.getByRole('list', { name: '1 of 2 operations pass, 1 fails' });
    expect(list.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('PATCH /pastries/{name} · failed')).toBeTruthy();
  });
});
