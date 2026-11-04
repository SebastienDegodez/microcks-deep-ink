import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../test/axe';
import { CommandBar, type CommandItem } from './command-bar';

const ITEMS: CommandItem[] = [
  { id: 'svc', label: 'Open API Pastry 2.0', kind: 'service', protocol: 'REST', hint: 'service' },
  { id: 'run', label: 'Run a test on API Pastry 2.0', kind: 'action', keywords: ['test', 'run'] },
  { id: 'op', label: 'GET /pastries', kind: 'operation', hint: 'operation' },
];

function Harness({ onCommand, onClose }: { onCommand?: (i: CommandItem) => void; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Search
      </button>
      <CommandBar
        items={ITEMS}
        open={open}
        label="Search and commands"
        onCommand={onCommand}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      />
    </>
  );
}

const field = () => screen.getByRole('combobox', { name: 'Search and commands' });
const activeOption = () => document.getElementById(field().getAttribute('aria-activedescendant') ?? '');

describe('CommandBar', () => {
  it('opens as a named modal dialog, focuses the field and groups the results by kind', () => {
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Search' });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('dialog', { name: 'Search and commands' })).toHaveProperty('open', true);
    expect(document.activeElement).toBe(field());
    const listbox = screen.getByRole('listbox', { name: 'Search and commands results' });
    const groups = within(listbox).getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Actions', 'Services', 'Operations']);
    expect(within(groups[0]!).getByRole('option', { name: /Run a test/ })).toHaveProperty('ariaSelected', 'true');
    expect(field().getAttribute('aria-expanded')).toBe('true');
    expect(field().getAttribute('aria-controls')).toBe(listbox.id);
    expect(screen.getByRole('status').textContent).toBe('3 results');
  });

  it('moves with the arrows (wrapping), runs on Enter, closes and returns focus', () => {
    const onCommand = vi.fn();
    const onClose = vi.fn();
    render(<Harness onCommand={onCommand} onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Search' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.keyDown(field(), { key: 'ArrowDown' });
    expect(activeOption()?.textContent).toContain('Open API Pastry 2.0');
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    fireEvent.keyDown(field(), { key: 'ArrowUp' });
    expect(activeOption()?.textContent).toContain('GET /pastries');
    fireEvent.keyDown(field(), { key: 'Home' });
    expect(activeOption()?.textContent).toContain('Run a test');
    fireEvent.keyDown(field(), { key: 'End' });
    fireEvent.keyDown(field(), { key: 'Enter' });
    expect(onCommand).toHaveBeenCalledWith(ITEMS[2]);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('filters on every word, announces the count and shows an empty state', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.change(field(), { target: { value: 'pastry test' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe('1 result');
    fireEvent.change(field(), { target: { value: 'nothing here' } });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(field().getAttribute('aria-expanded')).toBe('false');
    expect(field().hasAttribute('aria-activedescendant')).toBe(false);
    expect(screen.getByText(/No match/)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('No results');
  });

  it('closes on Escape and on the Close button, once each', () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const opener = screen.getByRole('button', { name: 'Search' });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.keyDown(field(), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('toggles with Ctrl/⌘K from anywhere, unless globalShortcut is off', () => {
    const { unmount } = render(<Harness />);
    act(() => {
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
    });
    expect(field().getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K');
    act(() => {
      fireEvent.keyDown(document, { key: 'K', ctrlKey: true });
    });
    expect(screen.queryByRole('combobox')).toBeNull();
    unmount();
    render(<CommandBar items={ITEMS} globalShortcut={false} />);
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders inline with a group name, and runs a clicked option', async () => {
    const onCommand = vi.fn();
    const { container } = render(<CommandBar inline items={ITEMS} label="Command bar" onCommand={onCommand} />);
    expect(screen.getByRole('group', { name: 'Command bar' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /GET \/pastries/ }));
    expect(onCommand).toHaveBeenCalledWith(ITEMS[2]);
    expect(await axeViolations(container)).toEqual([]);
  });
});
