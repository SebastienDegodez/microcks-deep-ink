import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import { Button, ButtonLink } from '../index.js';
import LegacyButton from './Button.svelte';
import LegacyButtonLink from './ButtonLink.svelte';
import { iconSize, requireName } from './button.js';
import { iconSize as canonicalIconSize, requireName as canonicalRequireName } from '../internal/button.js';

const text = (t: string) => createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Button', () => {
  it('is a native button of type button with variant hooks', () => {
    render(Button, { props: { variant: 'primary', children: text('Run test') } });
    const b = screen.getByRole('button', { name: 'Run test' });
    expect(b.tagName).toBe('BUTTON');
    expect(b.getAttribute('type')).toBe('button');
    expect(b.className).toContain('button');
    expect(b.getAttribute('data-variant')).toBe('primary');
    expect(b.getAttribute('data-size')).toBe('md');
  });

  it('merges class, forwards props and the ref', () => {
    const onclick = vi.fn();
    let ref: HTMLButtonElement | undefined;
    render(Button, { props: { class: ['mine', { active: true, hidden: false }], onclick, type: 'submit', get element() { return ref; }, set element(e) { ref = e; }, children: text('Go') } });
    expect(ref?.className).toBe('button mine active');
    expect(ref?.type).toBe('submit');
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onclick).toHaveBeenCalled();
  });

  it('loading sets aria-busy and disables', () => {
    render(Button, { props: { loading: true, children: text('Import') } });
    const b = screen.getByRole<HTMLButtonElement>('button', { name: 'Import' });
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
  });

  it('icon-only requires an accessible name', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(Button, { props: { iconOnly: true, icon: 'close', 'aria-label': 'Close' } });
    expect(screen.getByRole('button', { name: 'Close' }).getAttribute('data-icon-only')).toBe('');
    expect(error).not.toHaveBeenCalled();
    render(Button, { props: { iconOnly: true, icon: 'trash' } });
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });

  it('ButtonLink renders an anchor', () => {
    render(ButtonLink, { props: { href: '/x', children: text('Go') } });
    expect(screen.getByRole('link', { name: 'Go' }).className).toContain('button');
  });

  it('exposes the outline variant, the compact and large sizes and the danger tone', () => {
    render(Button, { props: { variant: 'outline', size: 'lg', children: text('Cancel') } });
    render(Button, { props: { variant: 'dashed', size: 'compact', icon: 'plus', children: text('Add header') } });
    render(Button, { props: { variant: 'ghost', size: 'sm', tone: 'danger', children: text('Delete') } });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel.getAttribute('data-variant')).toBe('outline');
    expect(cancel.getAttribute('data-size')).toBe('lg');
    expect(screen.getByRole('button', { name: 'Add header' }).querySelector('svg')?.getAttribute('width')).toBe('14');
    expect(screen.getByRole('button', { name: 'Delete' }).getAttribute('data-tone')).toBe('danger');
  });

  it('has a 36px tile size for card footers, with a 14px icon', () => {
    render(Button, { props: { variant: 'primary', size: 'tile', icon: 'download', children: text('Install') } });
    const install = screen.getByRole('button', { name: 'Install' });
    expect(install.getAttribute('data-size')).toBe('tile');
    expect(install.querySelector('svg')?.getAttribute('width')).toBe('14');
  });

  it('has no axe violations', async () => {
    render(Button, { props: { variant: 'primary', children: text('Save') } });
    render(Button, { props: { iconOnly: true, icon: 'close', 'aria-label': 'Close' } });
    render(ButtonLink, { props: { href: '/x', children: text('Open') } });
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('is reached with Tab and activated with Enter and Space, and calls onfocus and onblur', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Button, { props: { onclick, onfocus, onblur, children: text('Run') } });
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Run' }));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onclick).toHaveBeenCalledTimes(2);
    await user.tab();
    expect([onfocus.mock.calls.length, onblur.mock.calls.length]).toEqual([1, 1]);
  });

  it('a loading button is not activated', async () => {
    const user = userEvent.setup();
    const onclick = vi.fn();
    render(Button, { props: { loading: true, onclick, children: text('Import') } });
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(onclick).not.toHaveBeenCalled();
  });

  it('legacy helper exports are the canonical bindings', () => {
    expect(iconSize).toBe(canonicalIconSize);
    expect(requireName).toBe(canonicalRequireName);
    expect(iconSize('xs', 'outline')).toBe(14);
  });

  it('legacy component paths forward canonical classes, xs/link tone, refs and loading guards', async () => {
    let buttonElement: HTMLButtonElement | undefined;
    let linkElement: HTMLAnchorElement | undefined;
    const onclick = vi.fn();
    render(LegacyButton, { props: {
      size: 'xs', variant: 'outline', tone: 'link', icon: 'undo',
      class: ['legacy', { active: true }], children: text('Legacy action'),
      get element() { return buttonElement; }, set element(e) { buttonElement = e; },
    } });
    expect(buttonElement?.className).toBe('button legacy active');
    expect(buttonElement?.dataset.size).toBe('xs');
    expect(buttonElement?.dataset.tone).toBe('link');
    expect(buttonElement?.querySelector('svg')?.getAttribute('width')).toBe('14');
    render(LegacyButtonLink, { props: {
      href: '/never', loading: true, onclick, class: { legacy: true },
      children: text('Legacy unavailable'),
      get element() { return linkElement; }, set element(e) { linkElement = e; },
    } });
    expect(linkElement?.className).toBe('button legacy');
    expect(linkElement?.hasAttribute('href')).toBe(false);
    expect(linkElement?.tabIndex).toBe(-1);
    expect(linkElement?.getAttribute('aria-busy')).toBe('true');
    await fireEvent.click(linkElement!);
    await fireEvent.keyDown(linkElement!, { key: 'Enter' });
    expect(onclick).not.toHaveBeenCalled();
  });
});
