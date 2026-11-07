import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import axe from 'axe-core';
import { Button, ButtonLink } from '../src/lib/index.js';
import { ICON_PATHS } from '../src/lib/internal/icon-data.js';
import Harness from './ButtonHarness.svelte';

const variants = ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] as const;
const sizes = ['xs', 'sm', 'compact', 'tile', 'md', 'lg'] as const;

describe('native Button contract', () => {
  for (const kind of ['button', 'anchor']) for (const variant of variants) for (const size of sizes) {
    it(`${kind} ${variant}/${size}`, () => {
      const props = {
        variant, size, icon: 'never-tested', iconOnly: true, 'aria-label': 'Not tested',
        tone: 'link', confirm: true, class: ['extra', { active: true }], title: 'Native attribute',
      } as const;
      const { container } = kind === 'button' ? render(Button, props) : render(ButtonLink, props);
      const control = container.querySelector('.button')!;
      expect(control.getAttribute('data-variant')).toBe(variant);
      expect(control.getAttribute('data-size')).toBe(size);
      expect(control.getAttribute('data-tone')).toBe('link');
      expect(control.getAttribute('data-confirm')).toBe('');
      expect(control.getAttribute('data-icon-only')).toBe('');
      expect(control.classList.contains('extra')).toBe(true);
      expect(control.classList.contains('active')).toBe(true);
      expect(control.getAttribute('title')).toBe('Native attribute');
      const icon = control.querySelector('svg')!;
      expect(icon.getAttribute('width')).toBe(String(['xs', 'sm', 'compact', 'tile'].includes(size) || ['link', 'dashed'].includes(variant) ? 14 : 16));
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.getAttribute('focusable')).toBe('false');
      expect(icon.querySelector('path')!.getAttribute('stroke-dasharray')).toBe('3 3');
    });
  }

  for (const [icon, paths] of Object.entries(ICON_PATHS)) {
    it(`renders the complete registry glyph ${icon}`, () => {
      const { container } = render(Button, { icon: icon as keyof typeof ICON_PATHS, 'aria-label': icon });
      expect([...container.querySelectorAll('path')].map((path) => ({
        d: path.getAttribute('d'), dash: path.getAttribute('stroke-dasharray'),
      }))).toEqual(paths.map((path) => typeof path === 'string' ? { d: path, dash: null } : { d: path.d, dash: path.dash }));
    });
  }

  it('defaults to a non-submitting button; native snippets, events and bind:element work', async () => {
    const onclick = vi.fn();
    const onfocus = vi.fn();
    const onsubmit = vi.fn();
    const { container, getByRole } = render(Harness, { props: { props: { onclick, onfocus }, onsubmit } });
    const button = getByRole('button', { name: 'Save changes' }) as HTMLButtonElement;
    expect(button.type).toBe('button');
    expect(button.dataset.variant).toBe('secondary');
    expect(button.dataset.size).toBe('md');
    expect(button.querySelector('strong')!.textContent).toBe('changes');
    expect(container.querySelector('output')!.textContent).toBe('BUTTON');
    await fireEvent.click(button);
    await fireEvent.focus(button);
    expect(onclick).toHaveBeenCalledOnce();
    expect(onclick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(onfocus).toHaveBeenCalledOnce();
    expect(onsubmit).not.toHaveBeenCalled();
  });

  it('retains submit semantics and all native form attributes', async () => {
    const onsubmit = vi.fn();
    const { getByRole } = render(Harness, { props: {
      props: { type: 'submit', name: 'action', value: 'save', formmethod: 'post' }, onsubmit,
    } });
    const button = getByRole('button') as HTMLButtonElement;
    expect(button.name).toBe('action');
    expect(button.value).toBe('save');
    expect(button.getAttribute('formmethod')).toBe('post');
    await fireEvent.click(button);
    expect(onsubmit).toHaveBeenCalledOnce();
  });

  it('reactively disables busy actions and restores omitted invariant attributes', async () => {
    const onclick = vi.fn();
    const { container, rerender } = render(Button, { icon: 'copy', onclick, 'aria-label': 'Copy', 'aria-pressed': true });
    const button = container.querySelector('button')!;
    await rerender({ loading: true, iconOnly: true, confirm: true, variant: 'danger', size: 'xs', tone: 'danger' });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    await fireEvent.click(button);
    expect(onclick).not.toHaveBeenCalled();
    await rerender({ loading: false, disabled: true, iconOnly: false, confirm: false, tone: undefined });
    expect(button.disabled).toBe(true);
    for (const attribute of ['aria-busy', 'data-confirm', 'data-icon-only', 'data-tone']) expect(button.hasAttribute(attribute)).toBe(false);
    await rerender({ disabled: false, icon: undefined });
    expect(button.disabled).toBe(false);
    expect(button.querySelector('svg')).toBeNull();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledOnce();
  });
});

describe('native ButtonLink semantics', () => {
  for (const state of [{ disabled: true }, { loading: true }, { 'aria-disabled': 'true' as const }]) {
    it(`prevents pointer/keyboard activation when ${JSON.stringify(state)} and restores navigation`, async () => {
      const onclick = vi.fn();
      const onkeydown = vi.fn();
      const { container, rerender } = render(ButtonLink, { href: '#destination', tabindex: 2, onclick, onkeydown, ...state });
      const link = container.querySelector('a')!;
      expect(link.hasAttribute('href')).toBe(false);
      expect(link.tabIndex).toBe(-1);
      expect(link.getAttribute('aria-disabled')).toBe('loading' in state ? null : 'true');
      expect(link.getAttribute('role')).toBe('link');
      expect(await fireEvent.click(link)).toBe(false);
      expect(await fireEvent.keyDown(link, { key: 'Enter' })).toBe(false);
      expect(await fireEvent.keyDown(link, { key: ' ' })).toBe(false);
      expect(onclick).not.toHaveBeenCalled();
      expect(onkeydown).not.toHaveBeenCalled();
      await rerender({ disabled: false, loading: false, 'aria-disabled': undefined });
      expect(link.getAttribute('href')).toBe('#destination');
      expect(link.tabIndex).toBe(2);
      expect(link.hasAttribute('aria-disabled')).toBe(false);
      expect(link.hasAttribute('role')).toBe(false);
      await fireEvent.click(link);
      await fireEvent.keyDown(link, { key: 'Enter' });
      expect(onclick).toHaveBeenCalledOnce();
      expect(onkeydown).toHaveBeenCalledOnce();
    });
  }

  it('renders a real navigation anchor, not a button role', () => {
    const { getByRole } = render(Harness, { linkProps: { target: '_blank', rel: 'noopener' } });
    const link = getByRole('link', { name: 'View details' }) as HTMLAnchorElement;
    expect(link.getAttribute('role')).toBeNull();
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
  });
});

it('reports unnamed icon-only controls once, including whitespace-only names', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    render(Button, { iconOnly: true, icon: 'plus', 'aria-label': ' ' });
    render(Button, { iconOnly: true, icon: 'plus' });
    render(ButtonLink, { iconOnly: true, icon: 'plus' });
    expect(error).toHaveBeenCalledTimes(2);
    expect(error.mock.calls[0][0]).toContain('needs an accessible name');
  } finally { error.mockRestore(); }
});

it('has no structural accessibility violations with rich snippets, busy and named icon-only controls', async () => {
  const { container } = render(Harness, { props: {
    props: { icon: 'plus', iconOnly: true, 'aria-label': 'Save changes', loading: true },
    linkProps: { icon: 'external', 'aria-labelledby': 'destination' },
  } });
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations).toEqual([]);
});
