import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import RunnerLog from './RunnerLog.svelte';

describe('RunnerLog', () => {
  it('is a section and a focusable log, both named by the heading, with every level written', async () => {
    const { container } = render(RunnerLog, {
      props: {
        status: '2 lines · completed',
        lines: [
          { time: '14:12:08', level: 'SEND', text: 'message/send', emphasis: true },
          { time: '14:12:09', level: 'FAIL', text: 'tasks/get returned 500', error: true },
        ],
      },
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Runner log' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Runner log' })).toBeTruthy();
    const log = screen.getByRole('log', { name: 'Runner log' });
    expect(log.tabIndex).toBe(0);
    const items = screen.getAllByRole('listitem');
    expect(items.map((l) => l.textContent)).toEqual(['14:12:08SENDmessage/send', '14:12:09FAILtasks/get returned 500']);
    expect([items[0]!.hasAttribute('data-emphasis'), items[1]!.hasAttribute('data-error'), items[1]!.dataset.level]).toEqual([true, true, 'FAIL']);
    expect(container.querySelector('.runner-log-status')!.textContent).toBe('2 lines · completed');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('takes a title, a snippet status and appends new lines at the bottom', async () => {
    const status = createRawSnippet(() => ({ render: () => '<span>live · streaming</span>' }));
    const line = { time: '1', level: 'INFO' as const, text: 'first' };
    const { container, rerender } = render(RunnerLog, { props: { title: 'Conformance log', status, lines: [line] } });
    await rerender({ lines: [line, { time: '2', level: 'PASS', text: 'second' }] });
    expect(screen.getByRole('log', { name: 'Conformance log' }).querySelector('li:last-child .runner-log-text')!.textContent).toBe('second');
    expect(screen.getByText('live · streaming')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });
});
