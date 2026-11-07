import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Harness from '../../../test/fixtures/CommandBarHarness.svelte';
import CommandBar from './CommandBar.svelte';
import type { CommandItem } from './command-bar';

const ITEMS: CommandItem[] = [
  { id: 'svc', label: 'Open API Pastry 2.0', kind: 'service', protocol: 'REST', hint: 'service' },
  { id: 'run', label: 'Run a test on API Pastry 2.0', kind: 'action', keywords: ['test', 'run'] },
  { id: 'op', label: 'GET /pastries', kind: 'operation', hint: 'operation' },
];

const field = () => screen.getByRole('combobox', { name: 'Search and commands' });
const activeOption = () => document.getElementById(field().getAttribute('aria-activedescendant') ?? '');
const type = (value: string) => fireEvent.input(field(), { target: { value } });

describe('CommandBar', () => {
  it('opens as a named modal dialog, focuses the field and groups the results by kind', async () => {
    render(Harness, { props: { items: ITEMS } });
    const opener = screen.getByRole('button', { name: 'Search' });
    opener.focus();
    await fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Search and commands' })).toHaveProperty('open', true);
    expect(document.activeElement).toBe(field());
    const listbox = screen.getByRole('listbox', { name: 'Search and commands results' });
    const groups = within(listbox).getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Actions', 'Services', 'Operations']);
    expect(within(groups[0]!).getByRole('option', { name: /Run a test/ }).getAttribute('aria-selected')).toBe('true');
    expect(field().getAttribute('aria-expanded')).toBe('true');
    expect(field().getAttribute('aria-controls')).toBe(listbox.id);
    expect(screen.getByRole('status').textContent).toBe('3 results');
  });

  it('moves with the arrows (wrapping), runs on Enter, closes and returns focus', async () => {
    const onCommand = vi.fn();
    const onClose = vi.fn();
    render(Harness, { props: { items: ITEMS, onCommand, onClose } });
    const opener = screen.getByRole('button', { name: 'Search' });
    opener.focus();
    await fireEvent.click(opener);
    await fireEvent.keyDown(field(), { key: 'ArrowDown' });
    expect(activeOption()?.textContent).toContain('Open API Pastry 2.0');
    await fireEvent.keyDown(field(), { key: 'ArrowUp' });
    await fireEvent.keyDown(field(), { key: 'ArrowUp' });
    expect(activeOption()?.textContent).toContain('GET /pastries');
    await fireEvent.keyDown(field(), { key: 'Home' });
    expect(activeOption()?.textContent).toContain('Run a test');
    await fireEvent.keyDown(field(), { key: 'End' });
    await fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onCommand).toHaveBeenCalledWith(ITEMS[2]);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('filters on every word, announces the count and shows an empty state', async () => {
    render(Harness, { props: { items: ITEMS } });
    await fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await type('pastry test');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe('1 result');
    await type('nothing here');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(field().getAttribute('aria-expanded')).toBe('false');
    expect(field().hasAttribute('aria-activedescendant')).toBe(false);
    expect(screen.getByText(/No match/)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('No results');
  });

  it('closes on Escape and on the Close button, once each', async () => {
    const onClose = vi.fn();
    render(Harness, { props: { items: ITEMS, onClose } });
    const opener = screen.getByRole('button', { name: 'Search' });
    opener.focus();
    await fireEvent.click(opener);
    await fireEvent.keyDown(field(), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
    await fireEvent.click(opener);
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('toggles with Ctrl/⌘K from anywhere, unless globalShortcut is off', async () => {
    const { unmount } = render(Harness, { props: { items: ITEMS } });
    await fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(field().getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K');
    await fireEvent.keyDown(document, { key: 'K', ctrlKey: true });
    expect(screen.queryByRole('combobox')).toBeNull();
    unmount();
    render(CommandBar, { props: { items: ITEMS, globalShortcut: false } });
    await fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders inline with a group name, and runs a clicked option', async () => {
    const onCommand = vi.fn();
    const { container } = render(CommandBar, { props: { inline: true, items: ITEMS, label: 'Command bar', onCommand } });
    expect(screen.getByRole('group', { name: 'Command bar' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    await fireEvent.click(screen.getByRole('option', { name: /GET \/pastries/ }));
    expect(onCommand).toHaveBeenCalledWith(ITEMS[2]);
    await tick();
    expect(await axeViolations(container)).toEqual([]);
  });
});
