import { fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Menu from './Menu.svelte';

const setup = () => {
  const onCopy = vi.fn();
  const utils = render(Menu, {
    props: {
      label: 'Actions',
      items: [
        { id: 'copy', label: 'Copy service id', onSelect: onCopy },
        { id: 'test', label: 'Run a test', href: '/tests/create' },
        { id: 'off', label: 'Archive', disabled: true },
        { id: 'del', label: 'Delete service', danger: true },
      ],
    },
  });
  const trigger = screen.getByRole('button', { name: 'Actions' });
  const menu = document.querySelector<HTMLElement>('[popover]')!;
  return { ...utils, trigger, menu, onCopy };
};

const open = (menu: HTMLElement) => flushSync(() => menu.showPopover());

describe('Menu', () => {
  it('wires the trigger to the popover and mirrors aria-expanded', () => {
    const { trigger, menu } = setup();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe(menu.id);
    expect(trigger.getAttribute('popovertarget')).toBe(menu.id);
    open(menu);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    flushSync(() => menu.hidePopover());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('focuses the first item when it opens and moves with the arrow keys', async () => {
    const { menu } = setup();
    open(menu);
    const first = screen.getByRole('button', { name: 'Copy service id' });
    expect(document.activeElement).toBe(first);
    await fireEvent.keyDown(first, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Run a test' }));
    // The disabled item is skipped.
    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete service' }));
    await fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(first);
    await fireEvent.keyDown(first, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete service' }));
  });

  it('jumps with Home and End', async () => {
    const { menu } = setup();
    open(menu);
    await fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete service' }));
    await fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Copy service id' }));
  });

  it('runs the action and closes', async () => {
    const { menu, trigger, onCopy } = setup();
    open(menu);
    await fireEvent.click(screen.getByRole('button', { name: 'Copy service id' }));
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('uses native elements for items', () => {
    const { menu } = setup();
    const items = menu.querySelectorAll('.menu-item');
    expect(Array.from(items).map((i) => i.tagName)).toEqual(['BUTTON', 'A', 'BUTTON', 'BUTTON']);
    expect(menu.querySelector('[role="menu"], [role="menuitem"]')).toBeNull();
  });

  it('names an icon-only trigger', () => {
    render(Menu, { props: { label: 'More actions', icon: 'more', iconOnly: true, items: [{ id: 'a', label: 'A' }] } });
    const trigger = screen.getByRole('button', { name: 'More actions' });
    expect(trigger.getAttribute('data-icon-only')).toBe('');
  });

  it('has no axe violations', async () => {
    const { container, menu } = setup();
    open(menu);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('draws a separator and links an item description', () => {
    const { container } = render(Menu, {
      props: {
        label: 'More actions',
        icon: 'more-vertical',
        iconOnly: true,
        items: [
          { id: 'copy', label: 'Copy workflowId' },
          { id: 'del', label: 'Delete workflow', danger: true, disabled: true, separatorBefore: true, description: 'Workflows are removed with their Arazzo document.' },
        ],
      },
    });
    expect(container.querySelector('hr.menu-separator')).toBeTruthy();
    const del = container.querySelector('button.menu-item[data-tone="danger"]')!;
    expect(document.getElementById(del.getAttribute('aria-describedby')!)?.textContent).toBe('Workflows are removed with their Arazzo document.');
  });

  it('ArrowDown on the open trigger focuses the first item; Tab out of the menu closes it', async () => {
    const { trigger, menu, container } = setup();
    open(menu);
    trigger.focus();
    await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Copy service id' }));
    const outside = document.createElement('button');
    container.appendChild(outside);
    await fireEvent.focusOut(document.activeElement!, { relatedTarget: trigger });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    await fireEvent.focusOut(document.activeElement!, { relatedTarget: outside });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
