import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Button from './Button.svelte';
import ButtonLink from './ButtonLink.svelte';

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

  it('merges className, forwards props and the ref', () => {
    const onClick = vi.fn();
    let ref: HTMLButtonElement | undefined;
    render(Button, { props: { className: 'mine', onClick, type: 'submit', get element() { return ref; }, set element(e) { ref = e; }, children: text('Go') } });
    expect(ref?.className).toBe('button mine');
    expect(ref?.type).toBe('submit');
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalled();
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

  it('is reached with Tab and activated with Enter and Space, and calls onFocus and onBlur', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(Button, { props: { onClick, onFocus, onBlur, children: text('Run') } });
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Run' }));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
    await user.tab();
    expect([onFocus.mock.calls.length, onBlur.mock.calls.length]).toEqual([1, 1]);
  });

  it('a loading button is not activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(Button, { props: { loading: true, onClick, children: text('Import') } });
    await user.click(screen.getByRole('button', { name: 'Import' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
