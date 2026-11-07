// Every G1 component forwards any React-named handler and any data-* / aria-* attribute to the element that receives
// `...rest` in its React source: the root, or the <progress> / <meter> of Progress and Meter. Field spreads nothing in
// React, so it is not listed.
import { fireEvent, render } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import DescriptionList from './description-list/DescriptionList.svelte';
import Disclosure from './disclosure/Disclosure.svelte';
import Icon from './icon/Icon.svelte';
import Input from './input/Input.svelte';
import Textarea from './input/Textarea.svelte';
import Kbd from './kbd/Kbd.svelte';
import Link from './link/Link.svelte';
import Panel from './panel/Panel.svelte';
import Meter from './progress/Meter.svelte';
import Progress from './progress/Progress.svelte';
import Select from './select/Select.svelte';
import Skeleton from './skeleton/Skeleton.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cases: Array<[string, Component<any>, Record<string, unknown>, string]> = [
  ['DescriptionList', DescriptionList, { items: [{ term: 'T', value: 'V' }] }, 'dl'],
  ['Disclosure', Disclosure, { summary: 'S' }, 'details'],
  ['Icon', Icon, { name: 'check' }, 'svg'],
  ['Input', Input, {}, 'input'],
  ['Textarea', Textarea, {}, 'textarea'],
  ['Kbd', Kbd, {}, 'kbd'],
  ['Link', Link, { href: '#x' }, 'a'],
  ['Panel', Panel, { title: 'T' }, 'section'],
  ['Panel as div', Panel, { as: 'div' }, 'div.panel'],
  ['Progress', Progress, { label: 'L', value: 1 }, 'progress'],
  ['Meter', Meter, { label: 'L', value: 1, max: 2 }, 'meter'],
  ['Select', Select, {}, 'select'],
  ['Skeleton', Skeleton, {}, '.skeleton'],
  ['Skeleton lines', Skeleton, { lines: 2 }, '.skeleton-group'],
];

describe('React-named handlers and attributes (G1)', () => {
  it.each(cases)('%s forwards them to the same element as React', (_, C, props, selector) => {
    const spies = { onKeyDown: vi.fn(), onClick: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onMouseEnter: vi.fn(), onDoubleClick: vi.fn() };
    const { container } = render(C, { props: { ...props, ...spies, 'data-testid': 'x', 'aria-keyshortcuts': 'K' } });
    const el = container.querySelector<HTMLElement>(selector)!;
    expect([el.dataset.testid, el.getAttribute('aria-keyshortcuts')]).toEqual(['x', 'K']);
    fireEvent.keyDown(el, { key: 'a' });
    fireEvent.click(el);
    fireEvent.focus(el);
    fireEvent.blur(el);
    fireEvent.mouseEnter(el);
    fireEvent.dblClick(el);
    for (const [name, spy] of Object.entries(spies)) expect(spy, name).toHaveBeenCalledOnce();
    for (const name of Object.keys(spies)) expect(el.hasAttribute(name.toLowerCase())).toBe(false);
  });

  it.each([
    ['Input', Input, 'input'],
    ['Textarea', Textarea, 'textarea'],
  ] as const)('%s keeps onChange on every input event, and calls the native handlers first', (_, C, selector) => {
    const calls: string[] = [];
    const log = (name: string) => () => calls.push(name);
    const { container } = render(C as Component<Record<string, unknown>>, {
      props: { oninput: log('oninput'), onInput: log('onInput'), onChange: log('onChange'), onfocus: log('onfocus'), onFocus: log('onFocus') },
    });
    const el = container.querySelector<HTMLElement>(selector)!;
    fireEvent.input(el, { target: { value: 'a' } });
    fireEvent.change(el);
    fireEvent.focus(el);
    expect(calls).toEqual(['oninput', 'onInput', 'onChange', 'onfocus', 'onFocus']);
  });

  it('Select and Disclosure call both the native and the React handler of the same event', () => {
    const calls: string[] = [];
    const log = (name: string) => () => calls.push(name);
    const { container } = render(Select, { props: { onchange: log('onchange'), onChange: log('onChange') } });
    fireEvent.change(container.querySelector('select')!);
    const d = render(Disclosure, { props: { summary: 'S', ontoggle: log('ontoggle'), onToggle: log('onToggle') } });
    d.container.querySelector('details')!.dispatchEvent(new Event('toggle'));
    expect(calls).toEqual(['onchange', 'onChange', 'ontoggle', 'onToggle']);
  });
});
