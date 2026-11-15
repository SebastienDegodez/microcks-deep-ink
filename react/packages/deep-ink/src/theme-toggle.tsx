import { useEffect, useSyncExternalStore, type ButtonHTMLAttributes } from 'react';
import { Button } from './button';
import { Icon } from './icon';
import { THEME_EVENT, getTheme, restoreTheme, setTheme, type Theme } from './theme-toggle.theme';

export { THEME_EVENT, THEME_STORAGE_KEY, getTheme, restoreTheme, setTheme, type Theme } from './theme-toggle.theme';

function subscribe(onChange: () => void) {
  document.addEventListener(THEME_EVENT, onChange);
  return () => document.removeEventListener(THEME_EVENT, onChange);
}

const serverTheme = (): Theme => 'dark';

export interface ThemeToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'aria-pressed' | 'aria-label'> {
  /** Controlled theme. When set, the toggle never touches `<html>` or storage: handle `onThemeChange`. */
  theme?: Theme;
  /** Called with the requested theme on each click. */
  onThemeChange?: (theme: Theme) => void;
  /** Accessible name. Defaults to "Light theme". */
  label?: string;
}

/**
 * Toggle button for the light theme (a bordered square with the moon icon in both themes).
 * The label stays the same; `aria-pressed` tells whether the light theme is on.
 * Uncontrolled by default: it restores, applies and persists the theme on `<html>`.
 */
export function ThemeToggle({ theme: controlled, onThemeChange, label = 'Light theme', ...props }: ThemeToggleProps) {
  const stored = useSyncExternalStore(subscribe, getTheme, serverTheme);
  const isControlled = controlled !== undefined;
  const theme = controlled ?? stored;

  // Applies the saved preference once; the event it dispatches updates `stored`.
  useEffect(() => {
    if (!isControlled) restoreTheme();
  }, [isControlled]);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    if (!isControlled) setTheme(next);
    onThemeChange?.(next);
  };

  return (
    <Button
      {...props}
      type="button"
      variant="secondary"
      iconOnly
      className="theme-toggle"
      aria-label={label}
      aria-pressed={theme === 'light'}
      onClick={toggle}
    >
      <Icon name="moon" size={18} />
    </Button>
  );
}
