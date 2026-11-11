import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import SkillList from './SkillList.svelte';
import type { SkillItem } from './skill-list.js';
const skills: SkillItem[] = [{ id: 'recommend', name: 'Recommend a pastry', calls: 29, tags: ['menu'], result: 'pass' }, { id: 'order', name: 'Order a pastry', calls: 14, tags: ['orders'], result: 'fail', resultNote: 'resumed on a new taskId' }, { id: '__fallback', name: 'No skill matched', calls: 3, fallback: true, tags: ['fallback', 'out-of-scope'] }];
/** The non-empty text nodes that are direct children of `el`. */
const texts = (el: Element) => [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== '').map((n) => n.textContent);
const order = (container: HTMLElement) => container.querySelectorAll('.skill-item-row')[1]!;
describe('SkillList', () => {
  it('is a named read-only list and reads counts/results as words', () => {
    const { container } = render(SkillList, { props: { label: 'Skills', skills } });
    expect(screen.getByRole('list', { name: 'Skills' }).querySelectorAll('li')).toHaveLength(3);
    expect(container.textContent).toContain('14 calls in 24 hours'); expect(container.textContent).toContain('failed: resumed on a new taskId');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
  it('supports pressed selection and fallback labeling', async () => {
    const onselectskill = vi.fn(); const { container } = render(SkillList, { props: { label: 'Skills', skills, selectedId: 'order', onselectskill } });
    const buttons = screen.getAllByRole('button'); expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    await fireEvent.click(buttons[0]!); expect(onselectskill).toHaveBeenCalledWith('recommend');
    expect(container.textContent).not.toContain('__fallback'); expect(container.textContent).toContain('fallback · out-of-scope');
    expect(await axeViolations(container)).toEqual([]);
  });
  it('glues the call count to its hidden words, the space inside them', () => {
    const { container } = render(SkillList, { props: { label: 'Skills', skills } });
    const calls = order(container).querySelector('.skill-item-calls')!;
    expect(texts(calls)).toEqual(['14']);
    expect(calls.querySelector('.sr-only')!.textContent).toBe(' calls in 24 hours');
  });
  it('glues the result word to its icon', () => {
    const { container } = render(SkillList, { props: { label: 'Skills', skills } });
    expect(texts(order(container).querySelector('.skill-item-result')!)).toEqual(['failed']);
  });
  it('writes the hidden result note as ": " then the note', () => {
    const { container } = render(SkillList, { props: { label: 'Skills', skills } });
    expect(texts(order(container).querySelector('.skill-item-result .sr-only')!)).toEqual([': ', 'resumed on a new taskId']);
  });
});
