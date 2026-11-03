// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { axeViolations } from '../../test/axe';
import { isTerminalState, TaskLanes, TaskStateTag, TaskTimeline, type TaskTimelineNode } from './task-timeline';

afterEach(cleanup);

const NODES: TaskTimelineNode[] = [
  { state: 'submitted', at: '+0 ms' },
  { state: 'input-required', at: '+900 ms' },
  { state: 'working', at: '+200 ms', connector: 'reply “M”' },
  { state: 'completed', at: '+750 ms' },
];

describe('TaskStateTag', () => {
  it('writes the state', () => {
    render(<TaskStateTag state="input-required" />);
    expect(screen.getByText('input-required')).toBeTruthy();
  });

  it('knows the terminal states', () => {
    expect(['completed', 'failed', 'rejected', 'canceled'].every((s) => isTerminalState(s as never))).toBe(true);
    expect(isTerminalState('working')).toBe(false);
    expect(isTerminalState('input-required')).toBe(false);
  });
});

describe('TaskTimeline', () => {
  it('is a named list of states, with the text of a resuming reply and the unreached end states', () => {
    render(<TaskTimeline nodes={NODES} />);
    const list = screen.getByRole('list', { name: 'Task lifecycle' });
    expect(list.querySelectorAll('.task-timeline-node')).toHaveLength(4);
    expect(screen.getByText('reply “M”')).toBeTruthy();
    const unreached = list.querySelector('.task-timeline-unreached')!;
    expect(unreached.textContent).toContain('other end states');
    expect(unreached.textContent).toContain('failed');
    expect(unreached.textContent).not.toContain('completed');
  });

  it('makes the nodes toggle buttons that select and clear a step', () => {
    const onSelectNode = vi.fn();
    render(<TaskTimeline nodes={NODES} selectedIndex={1} onSelectNode={onSelectNode} />);
    const pressed = screen.getByRole('button', { name: 'input-required at +900 ms, show in script' });
    expect(pressed.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(pressed);
    expect(onSelectNode).toHaveBeenLastCalledWith(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'working at +200 ms, show in script' }));
    expect(onSelectNode).toHaveBeenLastCalledWith(2);
  });

  it('has no axe violations', async () => {
    const { container } = render(<TaskTimeline nodes={NODES} selectedIndex={0} onSelectNode={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('TaskLanes', () => {
  it('names each lane and says which nodes are illegal', async () => {
    const { container } = render(
      <TaskLanes
        lanes={[
          { label: 'Expected', sub: 'task script', tone: 'ok', nodes: [{ label: 'input-required', task: 'task t-1' }, { label: 'working', task: 'resumed', tone: 'ok' }] },
          { label: 'Actual', sub: 'HTTP+JSON', tone: 'bad', nodes: [{ label: 'input-required' }, { label: 'submitted', task: 'NEW task t-2', tone: 'bad' }, { label: '', absent: true }] },
        ]}
      />,
    );
    expect(screen.getByRole('list', { name: 'Expected: task script' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Actual: HTTP+JSON' }).textContent).toContain('(illegal)');
    expect(await axeViolations(container)).toEqual([]);
  });
});
