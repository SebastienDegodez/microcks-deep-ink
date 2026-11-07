// Proves the test harness itself on a fixture component: Svelte 5 runes in jsdom, Testing Library, user-event, axe.
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeViolations } from './axe';
import Counter from './fixtures/Counter.svelte';

describe('test harness', () => {
  it('renders, reacts to user events and runs axe', async () => {
    const { container } = render(Counter, { props: { label: 'Clicks' } });
    const button = screen.getByRole('button', { name: 'Clicks: 0' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await userEvent.setup().click(button);
    expect(button.textContent).toBe('Clicks: 1');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('reports axe violations', async () => {
    document.body.innerHTML = '<img src="x.png">';
    expect((await axeViolations(document.body)).join()).toMatch(/^image-alt/);
  });
});
