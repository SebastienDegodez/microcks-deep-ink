import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ButtonStoryCoverage from '../../../test/ButtonStoryCoverage.svelte';
import { ButtonLink } from '../index.js';
import { createRawSnippet } from 'svelte';

// Functional compositions formerly exposed as Actions/Button and Actions/ButtonLink stories.
describe('Button native form and snippet coverage', () => {
  it('submits natively, renders rich snippets, exposes the element and toggles pressed state', async () => {
    const onsubmit = vi.fn();
    render(ButtonStoryCoverage, { props: { props: { type: 'submit', variant: 'primary', icon: 'check' }, onsubmit } });
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save.querySelector('strong')?.textContent).toBe('changes');
    expect(screen.getByRole('status').textContent).toBe('BUTTON');
    await fireEvent.click(save);
    expect(onsubmit).toHaveBeenCalledOnce();
    const toggle = screen.getByRole('button', { name: 'Toggle details', pressed: false });
    await fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    const link = screen.getByRole('link', { name: 'View details' });
    expect(link.querySelector('strong')?.textContent).toBe('details');
    expect(link.getAttribute('href')).toBe('#destination');
  });

  it('preserves external anchor attributes and icon-only labels', () => {
    render(ButtonLink, { props: {
      href: 'https://microcks.io', target: '_blank', rel: 'noopener noreferrer', icon: 'external',
      children: createRawSnippet(() => ({ render: () => '<span>View details</span>' })),
    } });
    const external = screen.getByRole('link', { name: 'View details' });
    expect(external.getAttribute('target')).toBe('_blank');
    expect(external.getAttribute('rel')).toBe('noopener noreferrer');
    expect(external.querySelector('svg')).toBeTruthy();
    render(ButtonLink, { props: { href: '#details', icon: 'external', iconOnly: true, 'aria-label': 'Open details' } });
    expect(screen.getByRole('link', { name: 'Open details' }).getAttribute('data-icon-only')).toBe('');
  });
});
