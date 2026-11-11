import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import TaskStateTag from './TaskStateTag.svelte';
import TaskTimeline from './TaskTimeline.svelte';
import TaskLanes from './TaskLanes.svelte';
import { TASK_STATES, TASK_TERMINAL, isTerminalState, type TaskTimelineNode } from './types';
const nodes: TaskTimelineNode[] = [
  { state: 'submitted', at: '+0 ms' }, { state: 'input-required', at: '+900 ms' },
  { state: 'working', at: '+200 ms', connector: 'reply “M”' }, { state: 'completed', at: '+750 ms' },
];
/** The non-empty text nodes that are direct children of `el`. */
const texts = (el: Element) => [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== '').map((n) => n.textContent);
describe('TaskStateTag', () => {
  it.each(TASK_STATES)('writes %s with its distinguishing glyph', state => {
    const { container } = render(TaskStateTag, { state, ghost: true });
    expect(screen.getByText(state)).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-state]')?.getAttribute('data-ghost')).toBe('');
  });
  it('knows exactly the terminal states', () => {
    expect(TASK_TERMINAL.every(isTerminalState)).toBe(true);
    expect(TASK_STATES.filter(isTerminalState)).toEqual(TASK_TERMINAL);
    expect(isTerminalState('working')).toBe(false);
    expect(isTerminalState('input-required')).toBe(false);
  });
});
describe('TaskTimeline', () => {
  it('is a named list, writes the resuming reply and unreached end states', async () => {
    const { container } = render(TaskTimeline, { nodes });
    const list = screen.getByRole('list', { name: 'Task lifecycle' });
    expect(list.querySelectorAll('.task-timeline-node')).toHaveLength(4);
    expect(screen.getByText('reply “M”').getAttribute('data-text')).toBe('');
    const unreached = list.querySelector('.task-timeline-unreached');
    expect(unreached?.textContent).toContain('other end states');
    expect(unreached?.textContent).toContain('failed');
    expect(unreached?.textContent).not.toContain('completed');
    expect(screen.queryByRole('button')).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
  it('makes toggle buttons that select and clear a step by mouse and keyboard', async () => {
    const user = userEvent.setup(), onselectnode = vi.fn();
    const { container } = render(TaskTimeline, { nodes, selectedIndex: 1, onselectnode });
    const pressed = screen.getByRole('button', { name: 'input-required at +900 ms, show in script' });
    expect(pressed.getAttribute('aria-pressed')).toBe('true');
    await fireEvent.click(pressed);
    expect(onselectnode).toHaveBeenLastCalledWith(undefined);
    await fireEvent.click(screen.getByRole('button', { name: 'working at +200 ms, show in script' }));
    expect(onselectnode).toHaveBeenLastCalledWith(2);
    pressed.focus();
    await user.keyboard(' ');
    expect(onselectnode).toHaveBeenLastCalledWith(undefined);
    await user.keyboard('{Enter}');
    expect(onselectnode).toHaveBeenLastCalledWith(undefined);
    expect(await axeViolations(container)).toEqual([]);
  });
  it('supports custom labels, omitted unreached states and empty timelines', async () => {
    const { container, rerender } = render(TaskTimeline, { label: 'Cancelled task', showUnreached: false, nodes: [] });
    expect(screen.getByRole('list', { name: 'Cancelled task' }).children).toHaveLength(0);
    await rerender({ showUnreached: true });
    expect(container.querySelectorAll('[data-ghost]')).toHaveLength(4);
  });
});
describe('TaskLanes', () => {
  it('names each lane, writes legality, and supports absent nodes and keyboard scrolling', async () => {
    const user = userEvent.setup();
    const { container } = render(TaskLanes, { lanes: [
      { label: 'Expected', sub: 'task script', tone: 'ok', nodes: [{ label: 'input-required', task: 'task t-1' }, { label: 'working', task: 'resumed', at: '+2 s', tone: 'ok' }] },
      { label: 'Actual', sub: 'HTTP+JSON', tone: 'bad', nodes: [{ label: 'input-required' }, { label: 'submitted', task: 'NEW task t-2', tone: 'bad' }, { label: '', absent: true }] },
    ] });
    expect(screen.getByRole('list', { name: 'Expected: task script' }).textContent).toContain('(legal)');
    expect(screen.getByRole('list', { name: 'Actual: HTTP+JSON' }).textContent).toContain('(illegal)');
    expect(container.querySelector('[data-absent] span')?.getAttribute('aria-hidden')).toBe('true');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Task lanes' }));
    expect(await axeViolations(container)).toEqual([]);
  });
  it('writes the hidden legality as " (", the word, then ")"', () => {
    const { container } = render(TaskLanes, { lanes: [{ label: 'Actual', nodes: [{ label: 'submitted', tone: 'bad' }, { label: 'working', tone: 'ok' }] }] });
    expect([...container.querySelectorAll('.task-lane-label .sr-only')].map(texts)).toEqual([[' (', 'illegal', ')'], [' (', 'legal', ')']]);
  });
});
