import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Harness from '../../../test/fixtures/TabsHarness.svelte';
import TabPanel from './TabPanel.svelte';
import Tabs, { type TabItem } from './Tabs.svelte';

const items: TabItem[] = [
  { id: 'ops', label: 'Operations', count: 4 },
  { id: 'props', label: 'Properties' },
  { id: 'off', label: 'Archived', disabled: true },
  { id: 'tests', label: 'Tests' },
];

const OPS = /^Operations\s*,\s*4$/;
const tab = (name: string | RegExp) => screen.getByRole('tab', { name });
/** The non-empty text nodes that are direct children of `el`. */
const texts = (el: Element) => [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent !== '').map((n) => n.textContent);

describe('Tabs', () => {
  it('exposes tablist, selected state and panel wiring', () => {
    render(Harness, { props: { items } });
    expect(screen.getByRole('tablist', { name: 'Service sections' })).toBeTruthy();
    expect(tab(OPS).getAttribute('aria-selected')).toBe('true');
    expect(tab('Properties').getAttribute('aria-selected')).toBe('false');
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(tab(OPS).id);
    expect(tab(OPS).getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.textContent).toBe('Content of Operations');
  });

  it('uses a roving tabindex', () => {
    render(Harness, { props: { items } });
    expect(tab(OPS).tabIndex).toBe(0);
    expect(tab('Properties').tabIndex).toBe(-1);
    expect(tab('Tests').tabIndex).toBe(-1);
  });

  it('moves with the arrow keys, skips disabled tabs and wraps', async () => {
    const onchange = vi.fn();
    render(Harness, { props: { items, onchange } });
    await fireEvent.keyDown(tab(OPS), { key: 'ArrowRight' });
    expect(onchange).toHaveBeenLastCalledWith('props');
    expect(document.activeElement).toBe(tab('Properties'));
    await fireEvent.keyDown(tab('Properties'), { key: 'ArrowRight' });
    expect(onchange).toHaveBeenLastCalledWith('tests');
    await fireEvent.keyDown(tab('Tests'), { key: 'ArrowRight' });
    expect(onchange).toHaveBeenLastCalledWith('ops');
    await fireEvent.keyDown(tab(OPS), { key: 'ArrowLeft' });
    expect(onchange).toHaveBeenLastCalledWith('tests');
    expect(tab('Tests').getAttribute('aria-selected')).toBe('true');
  });

  it('jumps with Home and End', async () => {
    const onchange = vi.fn();
    render(Harness, { props: { items, onchange } });
    await fireEvent.keyDown(tab(OPS), { key: 'End' });
    expect(onchange).toHaveBeenLastCalledWith('tests');
    await fireEvent.keyDown(tab('Tests'), { key: 'Home' });
    expect(onchange).toHaveBeenLastCalledWith('ops');
    expect(document.activeElement).toBe(tab(OPS));
  });

  it('manual activation moves focus without selecting', async () => {
    const onchange = vi.fn();
    render(Harness, { props: { items, activation: 'manual', onchange } });
    await fireEvent.keyDown(tab(OPS), { key: 'ArrowRight' });
    expect(onchange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(tab('Properties'));
    expect(tab(OPS).getAttribute('aria-selected')).toBe('true');
    await fireEvent.click(tab('Properties'));
    expect(onchange).toHaveBeenCalledWith('props');
  });

  it('renders only the selected panel content', async () => {
    render(Harness, { props: { items } });
    await fireEvent.click(tab('Tests'));
    expect(screen.getByRole('tabpanel').textContent).toBe('Content of Tests');
    expect(document.querySelectorAll('[role="tabpanel"][hidden]').length).toBe(3);
  });

  it('has no axe violations', async () => {
    const { container } = render(Harness, { props: { items } });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Tabs icon and hint', () => {
  it('puts a hidden icon before the label and reads the hint after a comma', async () => {
    const panels = createRawSnippet(() => ({ render: () => '<div>Panels</div>' }));
    const { container } = render(Tabs, {
      props: {
        label: 'Source type',
        variant: 'card',
        value: 'file',
        idPrefix: 'src',
        items: [{ id: 'file', label: 'Upload', hint: 'one-off file', icon: 'document' }, { id: 'git', label: 'Git repository', hint: 'kept in sync', icon: 'git-branch' }],
        children: panels,
      },
    });
    render(TabPanel, { props: { id: 'file', value: 'file', idPrefix: 'src', children: createRawSnippet(() => ({ render: () => '<p>File</p>' })) } });
    render(TabPanel, { props: { id: 'git', value: 'file', idPrefix: 'src' } });
    const t = screen.getByRole('tab', { name: 'Upload, one-off file' });
    expect(t.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(t.querySelector('svg')?.getAttribute('width')).toBe('16');
    expect(container.querySelector('.tabs')?.getAttribute('data-variant')).toBe('card');
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(t.id);
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it('writes the hint as " " then the hint', () => {
    render(Tabs, { props: { label: 'Source type', value: 'file', items: [{ id: 'file', label: 'Upload', hint: 'one-off file' }] } });
    const hint = screen.getByRole('tab', { name: 'Upload, one-off file' }).querySelector('.tab-hint') as Element;
    expect(texts(hint)).toEqual([' ', 'one-off file']);
  });

  it('writes the alert label as " " then the label', () => {
    render(Tabs, {
      props: {
        label: 'Sections',
        value: 'users',
        items: [{ id: 'users', label: 'Users', alert: 2, alertLabel: 'pending changes' }, { id: 'roles', label: 'Roles', alert: 1 }],
      },
    });
    const [users, roles] = screen.getAllByRole('tab').map((t) => t.querySelector('.tab-alert > .sr-only:last-child') as Element);
    expect(texts(users as Element)).toEqual([' ', 'pending changes']);
    expect(texts(roles as Element)).toEqual([' ', 'need attention']);
  });
});
