// React has no ThemeToggle spec: these cover the registry a11y contract (aria-pressed, fixed label, storage key,
// data-theme on <html>, change event) and the restoreTheme export.
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import ThemeToggle from './ThemeToggle.svelte';
import { THEME_EVENT, THEME_STORAGE_KEY, getTheme, restoreTheme, setTheme } from './theme-toggle';

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle', () => {
  it('is a pressed-state button named "Light theme" with a decorative icon', async () => {
    const { container } = render(ThemeToggle);
    await tick();
    const button = screen.getByRole('button', { name: 'Light theme' });
    expect([button.getAttribute('aria-pressed'), button.className, button.dataset.variant]).toEqual(['false', 'button theme-toggle', 'secondary']);
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('toggles data-theme on <html>, stores it under microcks-theme and dispatches the change event', async () => {
    const onChange = vi.fn();
    document.addEventListener(THEME_EVENT, onChange);
    render(ThemeToggle);
    const button = screen.getByRole('button', { name: 'Light theme' });
    await fireEvent.click(button);
    expect([document.documentElement.dataset.theme, localStorage.getItem(THEME_STORAGE_KEY), button.getAttribute('aria-pressed')]).toEqual(['light', 'light', 'true']);
    await fireEvent.click(button);
    expect([getTheme(), localStorage.getItem('microcks-theme'), button.getAttribute('aria-pressed')]).toEqual(['dark', 'dark', 'false']);
    expect(onChange).toHaveBeenCalledTimes(2);
    document.removeEventListener(THEME_EVENT, onChange);
  });

  it('applies the saved preference on mount and follows changes made elsewhere', async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(ThemeToggle);
    await tick();
    const button = screen.getByRole('button', { name: 'Light theme' });
    expect([getTheme(), button.getAttribute('aria-pressed')]).toEqual(['light', 'true']);
    setTheme('dark', false);
    await tick();
    expect([button.getAttribute('aria-pressed'), localStorage.getItem(THEME_STORAGE_KEY)]).toEqual(['false', 'light']);
  });

  it('restoreTheme ignores invalid or blocked storage and returns the active theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia');
    expect(restoreTheme()).toBe('dark');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    document.documentElement.dataset.theme = 'light';
    expect(restoreTheme()).toBe('light');
  });
});
