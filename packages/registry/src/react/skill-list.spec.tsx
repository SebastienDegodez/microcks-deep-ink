// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { axeViolations } from '../../test/axe';
import { SkillList, type SkillItem } from './skill-list';

afterEach(cleanup);

const SKILLS: SkillItem[] = [
  { id: 'recommend-pastry', name: 'Recommend a pastry', calls: 29, tags: ['menu'], meta: '1 conversation', result: 'pass' },
  { id: 'order-pastry', name: 'Order a pastry', calls: 14, tags: ['orders', 'multi-turn'], meta: '1 conversation', result: 'fail', resultNote: 'resumed input-required on a new taskId' },
  { id: 'No skill matched', name: '', calls: 3, meta: 'fallback', fallback: true },
];

describe('SkillList', () => {
  it('is a named list that reads the call count with its unit and the result as a word', () => {
    render(<SkillList label="Skills of Pastry concierge 1.0" skills={SKILLS} />);
    const list = screen.getByRole('list', { name: 'Skills of Pastry concierge 1.0' });
    expect(list.querySelectorAll('li')).toHaveLength(3);
    expect(list.textContent).toContain('14 calls in 24 hours');
    expect(list.textContent).toContain('failed: resumed input-required on a new taskId');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('selects a skill with aria-pressed buttons', async () => {
    const onSelectSkill = vi.fn();
    const { container } = render(<SkillList label="Skills" skills={SKILLS} selectedId="order-pastry" onSelectSkill={onSelectSkill} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    fireEvent.click(buttons[0]!);
    expect(onSelectSkill).toHaveBeenCalledWith('recommend-pastry');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('leads the fallback entry with its name, never its internal id', () => {
    render(<SkillList label="Skills" skills={[{ id: '__fallback', name: 'No skill matched', calls: 3, fallback: true, tags: ['fallback', 'out-of-scope'] }]} />);
    const list = screen.getByRole('list', { name: 'Skills' });
    expect(list.textContent).not.toContain('__fallback');
    expect(list.textContent).toContain('No skill matched');
    expect(list.textContent).toContain('fallback · out-of-scope');
  });
});
