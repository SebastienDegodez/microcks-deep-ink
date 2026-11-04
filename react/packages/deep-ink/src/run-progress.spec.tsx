import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { RunProgress } from './run-progress';
import { RunnerLog } from './runner-log';

describe('RunProgress', () => {
  it('writes the count, names the bar and announces the current step', async () => {
    const { container } = render(
      <RunProgress
        done={5}
        total={7}
        caption="test steps done"
        nowLabel="Now calling"
        now="PATCH /pastries/{name}"
        segments={['done', 'done', 'done', 'failed', 'done', 'current', 'queued']}
        counts={[{ kind: 'pass', text: '4 passed' }, { kind: 'fail', text: '1 failed' }]}
        action={<button type="button">Step forward</button>}
      />,
    );
    expect(screen.getByRole('region', { name: 'Progress' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '5 of 7 test steps done' }).children).toHaveLength(7);
    expect(screen.getByText('PATCH /pastries/{name}').closest('[aria-live]')?.getAttribute('aria-live')).toBe('polite');
    expect(screen.getByText('1 failed')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('RunnerLog', () => {
  it('is a log named by its heading, with written levels', async () => {
    const { container } = render(
      <RunnerLog status="2 lines · completed" lines={[{ time: '09:10:04', level: 'SEND', text: 'GET /pastries' }, { time: '09:10:05', level: 'FAIL', text: 'price', error: true }]} />,
    );
    const log = screen.getByRole('log', { name: 'Runner log' });
    expect(log.querySelectorAll('li')).toHaveLength(2);
    expect(log.textContent).toContain('FAIL');
    expect(await axeViolations(container)).toEqual([]);
  });
});
