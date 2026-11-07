// Every component of the batch forwards any React-named handler and any data-* / aria-* attribute to the same element
// as React: the root, or the <input> of Checkbox, Radio and Switch.
import { fireEvent, render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Button from './button/Button.svelte';
import ButtonLink from './button/ButtonLink.svelte';
import Callout from './callout/Callout.svelte';
import Checkbox from './checkbox/Checkbox.svelte';
import Radio from './checkbox/Radio.svelte';
import MethodTag from './method-tag/MethodTag.svelte';
import { reactEvents } from './react-events';
import Switch from './switch/Switch.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cases: Array<[string, Component<any>, Record<string, unknown>, string]> = [
  ['Button', Button, {}, 'button'],
  ['ButtonLink', ButtonLink, { href: '/x' }, 'a'],
  ['Callout', Callout, { title: 'T' }, '.callout'],
  ['MethodTag', MethodTag, { method: 'GET' }, '.method'],
  ['Checkbox', Checkbox, { label: 'L' }, 'input'],
  ['Radio', Radio, { label: 'L' }, 'input'],
  ['Switch', Switch, { label: 'L', checked: false }, 'input'],
];

describe('React-named handlers and attributes', () => {
  it.each(cases)('%s forwards them to the same element as React', (_, C, props, selector) => {
    const spies = { onKeyDown: vi.fn(), onClick: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onMouseEnter: vi.fn(), onDoubleClick: vi.fn() };
    const { container } = render(C, { props: { ...props, ...spies, 'data-testid': 'x', 'aria-keyshortcuts': 'K' } });
    const el = container.querySelector<HTMLElement>(selector)!;
    expect([el.dataset.testid, el.getAttribute('aria-keyshortcuts')]).toEqual(['x', 'K']);
    fireEvent.keyDown(el, { key: 'a' });
    fireEvent.click(el);
    fireEvent.focusIn(el);
    fireEvent.focusOut(el);
    fireEvent.mouseEnter(el);
    fireEvent.dblClick(el);
    for (const [name, spy] of Object.entries(spies)) expect(spy, name).toHaveBeenCalledOnce();
    for (const name of Object.keys(spies)) expect(el.hasAttribute(name.toLowerCase())).toBe(false);
  });

  it('Button runs onDoubleClickCapture once, in the capture phase', () => {
    const calls: string[] = [];
    const { container } = render(Button, { props: { onDoubleClickCapture: () => calls.push('capture'), onDoubleClick: () => calls.push('bubble') } });
    const button = container.querySelector('button')!;
    fireEvent.dblClick(button);
    expect(calls).toEqual(['capture', 'bubble']);
    expect(button.hasAttribute('ondoubleclickcapture')).toBe(false);
  });

  it('calls the native and the React handler of the same event, the native one first', () => {
    const calls: string[] = [];
    const out = reactEvents({ onClick: () => calls.push('React'), onclick: () => calls.push('native'), onKeyUp: undefined, id: 'a' });
    expect(Object.keys(out).sort()).toEqual(['id', 'onclick']);
    (out.onclick as () => void)();
    expect(calls).toEqual(['native', 'React']);
  });
});
