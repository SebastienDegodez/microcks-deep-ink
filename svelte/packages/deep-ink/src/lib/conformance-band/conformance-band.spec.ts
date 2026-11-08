import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ConformanceBand from './ConformanceBand.svelte';
import { conformanceLabel, type OperationResult } from './model.js';
import { axeViolations } from '../../../test/axe';
const twelve: OperationResult[] = [...Array<OperationResult>(11).fill('pass'), 'fail'];
describe('ConformanceBand', () => {
  it('spells out the counts in the accessible label', () => {
    render(ConformanceBand, { outcomes: twelve });
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('11 of 12 operations pass, 1 fails');
  });
  it('handles plurals, untested operations, custom units and empty input', () => {
    expect(conformanceLabel(['pass','fail','fail','untested'])).toBe('1 of 4 operations pass, 2 fail, 1 untested');
    expect(conformanceLabel(['pass'])).toBe('1 of 1 operation pass');
    expect(conformanceLabel([])).toBe('No operations');
    expect(conformanceLabel(['pass','fail','fail'],'skill')).toBe('1 of 3 skills pass, 2 fail');
    render(ConformanceBand, { outcomes:['pass','fail'],unit:'skill',size:'mini' });
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('1 of 2 skills pass, 1 fails');
  });
  it('writes the score and visible summary with its level', async () => {
    const { container, rerender } = render(ConformanceBand, { outcomes:twelve,showSummary:true });
    expect(container.querySelector('.conformance-summary')?.textContent).toContain('92%');
    expect(container.querySelector('.conformance-summary')?.textContent).toContain('11 of 12 operations pass, 1 fails');
    expect(container.querySelector('.conformance-score')?.getAttribute('data-level')).toBe('high');
    await rerender({outcomes:['pass','fail']});
    expect(container.querySelector('.conformance-score')?.getAttribute('data-level')).toBe('mid');
    await rerender({outcomes:[]});
    expect(container.querySelector('.conformance-score')?.getAttribute('data-level')).toBe('low');
  });
  it('renders one cell per operation and suppresses summaries in mini size', () => {
    const {container} = render(ConformanceBand,{outcomes:['pass','untested','fail'],size:'mini',showSummary:true});
    expect(container.querySelectorAll('[data-result]')).toHaveLength(3);
    expect(container.querySelector('.conformance-summary')).toBeNull();
  });
  it('has no summary by default', () => {
    const {container} = render(ConformanceBand,{outcomes:twelve});
    expect(container.querySelector('.conformance-summary')).toBeNull();
  });
  it('writes each label as a named list, including a summary when requested', async () => {
    const {container} = render(ConformanceBand,{outcomes:['pass','fail'],labels:['GET /pastries · passed','PATCH /pastries/{name} · failed'],showSummary:true});
    expect(screen.getByRole('list',{name:'1 of 2 operations pass, 1 fails'}).querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('PATCH /pastries/{name} · failed')).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });
});
