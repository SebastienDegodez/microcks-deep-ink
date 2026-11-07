import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import AppShellHarness from '../../../test/fixtures/AppShellHarness.svelte';
import type { ShellNavItem } from './app-shell';

const NAV: ShellNavItem[] = [
  { id: 'cockpit', label: 'Cockpit', href: '#/cockpit' },
  { id: 'services', label: 'APIs & Services', href: '#/services', badge: '12' },
];

const shell = (activeId = 'services') => render(AppShellHarness, { props: { nav: NAV, activeId } });

describe('AppShell', () => {
  it('renders banner, navigation and main landmarks', () => {
    shell();
    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('puts the skip link first and targets #main', () => {
    const { container } = shell();
    const skip = screen.getByText('Skip to content') as HTMLAnchorElement;
    expect(skip.getAttribute('href')).toBe('#main');
    expect(container.querySelector('.shell')?.firstElementChild).toBe(skip);
    const main = screen.getByRole('main');
    expect(main.id).toBe('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  it('moves focus to main when the skip link is used, without touching the hash', async () => {
    shell();
    const before = window.location.hash;
    await fireEvent.click(screen.getByText('Skip to content'));
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(window.location.hash).toBe(before);
  });

  it('marks only the active link with aria-current="page"', () => {
    shell('services');
    expect(screen.getByRole('link', { name: /APIs & Services/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Cockpit' }).getAttribute('aria-current')).toBeNull();
  });

  it('supports renderLink for router links', () => {
    render(AppShellHarness, { props: { nav: NAV, activeId: 'cockpit', routerLinks: true, heading: 'Page' } });
    const links = document.querySelectorAll<HTMLAnchorElement>('[data-router-link]');
    expect(links).toHaveLength(2);
    expect([links[0]!.className, links[0]!.getAttribute('aria-current'), links[1]!.textContent]).toEqual(['sidenav-link', 'page', 'APIs & Services12']);
  });

  it('collapses the nav behind a disclosure button that mirrors aria-expanded', async () => {
    const { container } = shell();
    const menu = screen.getByRole('button', { name: 'Menu' });
    const nav = container.querySelector('nav') as HTMLElement;
    expect(menu.getAttribute('aria-controls')).toBe(nav.id);
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(nav.getAttribute('data-open')).toBe('false');

    await fireEvent.click(menu);
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(nav.getAttribute('data-open')).toBe('true');

    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menu);
  });

  it('closes the nav after a link is chosen', async () => {
    shell();
    const menu = screen.getByRole('button', { name: 'Menu' });
    await fireEvent.click(menu);
    await fireEvent.click(screen.getByRole('link', { name: 'Cockpit' }));
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('has no axe violations (contrast is checked by the tokens test)', async () => {
    const { container } = shell();
    expect(await axeViolations(container)).toEqual([]);
  });
});
