// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { AppShell, type ShellNavItem } from './app-shell';

afterEach(cleanup);

const NAV: ShellNavItem[] = [
  { id: 'cockpit', label: 'Cockpit', href: '#/cockpit' },
  { id: 'services', label: 'APIs & Services', href: '#/services', badge: '12' },
];

const shell = (activeId = 'services') =>
  render(
    <AppShell brand="Microcks" nav={NAV} activeId={activeId}>
      <h1>APIs &amp; Services</h1>
    </AppShell>,
  );

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
    expect(container.querySelector('.di-shell')?.firstElementChild).toBe(skip);
    const main = screen.getByRole('main');
    expect(main.id).toBe('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  it('moves focus to main when the skip link is used, without touching the hash', () => {
    shell();
    const before = window.location.hash;
    fireEvent.click(screen.getByText('Skip to content'));
    expect(document.activeElement).toBe(screen.getByRole('main'));
    expect(window.location.hash).toBe(before);
  });

  it('marks only the active link with aria-current="page"', () => {
    shell('services');
    expect(screen.getByRole('link', { name: /APIs & Services/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Cockpit' }).getAttribute('aria-current')).toBeNull();
  });

  it('supports renderLink for router links', () => {
    render(
      <AppShell
        brand="Microcks"
        nav={NAV}
        activeId="cockpit"
        renderLink={(item, props) => (
          <a {...props} data-router-link={item.id}>
            {props.children}
          </a>
        )}
      >
        <h1>Page</h1>
      </AppShell>,
    );
    expect(document.querySelectorAll('[data-router-link]')).toHaveLength(2);
  });

  it('collapses the nav behind a disclosure button that mirrors aria-expanded', () => {
    const { container } = shell();
    const menu = screen.getByRole('button', { name: 'Menu' });
    const nav = container.querySelector('nav') as HTMLElement;
    expect(menu.getAttribute('aria-controls')).toBe(nav.id);
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(nav.getAttribute('data-open')).toBe('false');

    fireEvent.click(menu);
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(nav.getAttribute('data-open')).toBe('true');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menu);
  });

  it('closes the nav after a link is chosen', () => {
    shell();
    const menu = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(menu);
    fireEvent.click(screen.getByRole('link', { name: 'Cockpit' }));
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('has no axe violations (contrast is checked by the tokens test)', async () => {
    const { container } = shell();
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});
