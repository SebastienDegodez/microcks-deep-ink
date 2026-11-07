import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Disclosure from './Disclosure.svelte';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<p>${t}</p>` }));
const details = () => screen.getByRole<HTMLDetailsElement>('group');
const summary = () => screen.getByText('Advanced options');

describe('Disclosure', () => {
  it('is a native details, closed by default, with no aria-expanded on the summary', async () => {
    const { container } = render(Disclosure, { props: { summary: 'Advanced options', children: text('Dispatcher rules.') } });
    expect(details().localName).toBe('details');
    expect(details().open).toBe(false);
    expect(summary().localName).toBe('summary');
    expect(summary().hasAttribute('aria-expanded')).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('starts open with defaultOpen', () => {
    render(Disclosure, { props: { summary: 'Advanced options', defaultOpen: true, children: text('Open by default.') } });
    expect(details().open).toBe(true);
    expect(screen.getByText('Open by default.')).toBeTruthy();
  });

  it('toggles with Enter and Space on the focused summary, and calls onToggle', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(Disclosure, { props: { summary: 'Advanced options', onToggle, children: text('Dispatcher rules.') } });
    await user.tab();
    expect(document.activeElement).toBe(summary());
    await user.keyboard('{Enter}');
    expect(details().open).toBe(true);
    await user.keyboard(' ');
    expect(details().open).toBe(false);
    await vi.waitFor(() => expect(onToggle).toHaveBeenCalledTimes(2));
  });

  it('toggles on a click on the summary', async () => {
    const user = userEvent.setup();
    render(Disclosure, { props: { summary: 'Advanced options', className: 'wide', children: text('Dispatcher rules.') } });
    expect(details().classList.contains('wide')).toBe(true);
    await user.click(summary());
    expect(details().open).toBe(true);
  });

  it('takes a snippet as summary', () => {
    render(Disclosure, { props: { summary: createRawSnippet(() => ({ render: () => '<strong>Headers</strong>' })) } });
    expect(screen.getByText('Headers').parentElement!.localName).toBe('summary');
  });
});
