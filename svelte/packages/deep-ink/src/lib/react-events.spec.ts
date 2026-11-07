// Every component of the batch forwards any React-named handler and any data-* / aria-* attribute to the same element
// as React: the root, the <input> of Checkbox, Radio and Switch, the <button> of CopyButton, the <figure> of CodeBlock
// (its <pre> with frame="none"). Segmented, Tabs, TabPanel, Dialog, Menu and DataTable spread nothing in React, so
// they forward nothing.
import { fireEvent, render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Button from './button/Button.svelte';
import ButtonLink from './button/ButtonLink.svelte';
import Callout from './callout/Callout.svelte';
import Checkbox from './checkbox/Checkbox.svelte';
import Chip from './chip/Chip.svelte';
import CodeBlock from './code-block/CodeBlock.svelte';
import CopyButton from './copy-button/CopyButton.svelte';
import EmptyState from './empty-state/EmptyState.svelte';
import Radio from './checkbox/Radio.svelte';
import MethodTag from './method-tag/MethodTag.svelte';
import { reactEvents } from './react-events';
import Segmented from './segmented/Segmented.svelte';
import Switch from './switch/Switch.svelte';
import TabPanel from './tabs/TabPanel.svelte';
import Tabs from './tabs/Tabs.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cases: Array<[string, Component<any>, Record<string, unknown>, string]> = [
  ['Button', Button, {}, 'button'],
  ['ButtonLink', ButtonLink, { href: '/x' }, 'a'],
  ['Callout', Callout, { title: 'T' }, '.callout'],
  ['MethodTag', MethodTag, { method: 'GET' }, '.method'],
  ['Checkbox', Checkbox, { label: 'L' }, 'input'],
  ['Radio', Radio, { label: 'L' }, 'input'],
  ['Switch', Switch, { label: 'L', checked: false }, 'input'],
  ['EmptyState', EmptyState, { title: 'T' }, 'section'],
  ['Chip toggle', Chip, { pressed: false, children: 'C' }, 'button'],
  ['CodeBlock', CodeBlock, { code: 'x' }, 'figure'],
  ['CodeBlock frame="none"', CodeBlock, { code: 'x', frame: 'none' }, 'pre'],
];

describe('React-named handlers and attributes', () => {
  it.each(cases)('%s forwards them to the same element as React', (_, C, props, selector) => {
    const spies = { onKeyDown: vi.fn(), onClick: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onMouseEnter: vi.fn(), onDoubleClick: vi.fn(), onDoubleClickCapture: vi.fn(), onKeyDownCapture: vi.fn() };
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

  it('a static Chip forwards them to its span, except onClick (as React)', () => {
    const spies = { onKeyDown: vi.fn(), onClick: vi.fn(), onFocus: vi.fn(), onMouseEnter: vi.fn(), onDoubleClickCapture: vi.fn() };
    const { container } = render(Chip, { props: { ...spies, children: 'C', 'data-testid': 'x' } });
    const el = container.querySelector<HTMLElement>('span.chip')!;
    fireEvent.keyDown(el);
    fireEvent.click(el);
    fireEvent.focusIn(el);
    fireEvent.mouseEnter(el);
    fireEvent.dblClick(el);
    expect(el.dataset.testid).toBe('x');
    expect(Object.values(spies).map((s) => s.mock.calls.length)).toEqual([1, 0, 1, 1, 1]);
  });

  it('CopyButton forwards them to its button, which still copies on click', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const spies = { onKeyDown: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onMouseEnter: vi.fn(), onDoubleClick: vi.fn(), onClickCapture: vi.fn() };
    const { container } = render(CopyButton, { props: { value: 'v', ...spies, 'data-testid': 'x', 'aria-keyshortcuts': 'K' } });
    const el = container.querySelector('button')!;
    expect([el.dataset.testid, el.getAttribute('aria-keyshortcuts')]).toEqual(['x', 'K']);
    fireEvent.keyDown(el);
    fireEvent.click(el);
    fireEvent.focusIn(el);
    fireEvent.focusOut(el);
    fireEvent.mouseEnter(el);
    fireEvent.dblClick(el);
    for (const [name, spy] of Object.entries(spies)) expect(spy, name).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith('v');
  });

  it.each([
    ['Segmented', Segmented, { label: 'L', value: 'a', options: [{ id: 'a', label: 'A' }] }],
    ['Tabs', Tabs, { label: 'L', value: 'a', items: [{ id: 'a', label: 'A' }] }],
    ['TabPanel', TabPanel, { id: 'a', value: 'a' }],
  ] as const)('%s forwards nothing, as React', (_, C, props) => {
    const onClick = vi.fn();
    const { container } = render(C as Component<Record<string, unknown>>, { props: { ...props, onClick, 'data-testid': 'x' } });
    fireEvent.click(container.firstElementChild!);
    expect([container.querySelector('[data-testid]'), onClick.mock.calls.length]).toEqual([null, 0]);
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
