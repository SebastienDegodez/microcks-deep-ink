import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import RunTarget from './RunTarget.svelte';
import { axeViolations } from '../../../test/axe';
describe('RunTarget', () => {
  it.each([['mocks', 'Mocks'], ['implementations', 'Implementations'], ['mixed', 'Mixed'] ] as const)('writes %s', async (target, word) => {
    const { container } = render(RunTarget, { props: { target, class: 'extra' } });
    expect(screen.getByText(word)).toBeTruthy();
    expect(container.querySelector('.run-target.extra')?.getAttribute('data-target')).toBe(target);
    expect(container.querySelector('[data-variant="dashed"]') !== null).toBe(target === 'mixed');
    expect(await axeViolations(container)).toEqual([]);
  });
});
