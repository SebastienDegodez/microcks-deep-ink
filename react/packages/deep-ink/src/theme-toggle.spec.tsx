import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../test/axe';
import { THEME_STORAGE_KEY, ThemeToggle } from './theme-toggle';

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe('ThemeToggle', () => {
  it('uncontrolled: toggles <html data-theme>, persists it and reports it', () => {
    const onThemeChange = vi.fn();
    render(<ThemeToggle onThemeChange={onThemeChange} />);
    const button = screen.getByRole('button', { name: 'Light theme' });
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(onThemeChange).toHaveBeenCalledWith('light');
  });

  it('uncontrolled: restores the saved theme on mount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('controlled: reflects `theme`, never touches <html> or storage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const onThemeChange = vi.fn();
    render(<ThemeToggle theme="dark" onThemeChange={onThemeChange} label="Thème clair" />);
    const button = screen.getByRole('button', { name: 'Thème clair' });
    fireEvent.click(button);
    expect(onThemeChange).toHaveBeenCalledWith('light');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ThemeToggle />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
