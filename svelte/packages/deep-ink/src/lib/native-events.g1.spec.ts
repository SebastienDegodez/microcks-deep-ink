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
import { eventProps } from './event-props';
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

describe('Native Svelte handlers and attributes (G1)', () => {
  it.each(cases)('%s forwards them to the underlying native element', (_, C, props, selector) => {
    const spies = { onkeydown: vi.fn(), onclick: vi.fn(), onfocus: vi.fn(), onblur: vi.fn(), onmouseenter: vi.fn(), ondblclick: vi.fn(), ondblclickcapture: vi.fn(), onkeydowncapture: vi.fn() };
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
    expect(el.hasAttribute('ondblclickcapture')).toBe(false);
  });

  it.each([
    ['Input', Input, 'input'],
    ['Textarea', Textarea, 'textarea'],
  ] as const)('%s keeps input, change, focus and focusin as distinct native events', (_, C, selector) => {
    const calls: string[] = [];
    const log = (name: string) => () => calls.push(name);
    const { container } = render(C as Component<Record<string, unknown>>, {
      props: { oninput: log('oninput'), onchange: log('onchange'), onfocusin: log('onfocusin'), onfocus: log('onfocus') },
    });
    const el = container.querySelector<HTMLElement>(selector)!;
    fireEvent.input(el, { target: { value: 'a' } });
    fireEvent.change(el);
    fireEvent.focus(el);
    fireEvent.focusIn(el);
    expect(calls).toEqual(['oninput', 'onchange', 'onfocus', 'onfocusin']);
  });

  it('Select and Disclosure call their native change and toggle handlers', () => {
    const calls: string[] = [];
    const log = (name: string) => () => calls.push(name);
    const { container } = render(Select, { props: { onchange: log('onchange') } });
    fireEvent.change(container.querySelector('select')!);
    const d = render(Disclosure, { props: { summary: 'S', ontoggle: log('ontoggle') } });
    d.container.querySelector('details')!.dispatchEvent(new Event('toggle'));
    expect(calls).toEqual(['onchange', 'ontoggle']);
  });

  it.each([
    ['onclick', 'click', false],
    ['onclickcapture', 'click', true],
    ['ondblclick', 'dblclick', false],
    ['ondblclickcapture', 'dblclick', true],
    ['onkeydowncapture', 'keydown', true],
    ['onfocus', 'focusin', false],
    ['onfocuscapture', 'focusin', true],
    ['onblur', 'focusout', false],
    ['onblurcapture', 'focusout', true],
    ['onmouseenter', 'mouseenter', false],
    ['onmouseleave', 'mouseleave', false],
    ['onchange', 'change', false],
    ['onchangecapture', 'change', true],
    ['ongotpointercapture', 'gotpointercapture', false],
    ['onlostpointercapturecapture', 'lostpointercapture', true],
    ['ontoggle', 'toggle', false],
    ['onsomecustomevent', 'somecustomevent', false],
    ['onsomecustomeventcapture', 'somecustomevent', true],
  ] as const)('preserves %s without translating its event or phase', (...args) => {
    const key = args[0];
    const handler = vi.fn();
    const props = { [key]: handler };
    expect(eventProps(props)).toBe(props);
    expect(eventProps(props)[key]).toBe(handler);
  });

  it('preserves non-handler props and capture handlers', () => {
    const out = eventProps({ ondblclickcapture: () => {}, onclickcapture: () => {}, id: 'a' });
    expect(Object.keys(out).sort()).toEqual(['id', 'onclickcapture', 'ondblclickcapture']);
  });

  it('runs a Capture handler once, in the capture phase, before the handlers of a descendant', () => {
    const calls: string[] = [];
    const { container } = render(Panel, {
      props: { title: 'T', onclickcapture: () => calls.push('capture'), onclick: () => calls.push('bubble'), ondblclickcapture: () => calls.push('dblclick capture') },
    });
    container.querySelector('.panel-title')!.addEventListener('click', () => calls.push('target'));
    fireEvent.click(container.querySelector('.panel-title')!);
    fireEvent.dblClick(container.querySelector('.panel-title')!);
    expect(calls).toEqual(['capture', 'target', 'bubble', 'dblclick capture']);
  });
});
