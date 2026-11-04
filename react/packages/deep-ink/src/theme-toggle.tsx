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

export type ThemeToggleProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'aria-pressed' | 'aria-label'>;

/**
 * Toggle button for the light theme (a bordered square with the moon icon in both themes).
 * The label stays "Light theme"; `aria-pressed` tells whether it is on.
 */
export function ThemeToggle(props: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribe, getTheme, serverTheme);

  // Applies the saved preference once; the event it dispatches updates `theme`.
  useEffect(() => {
    restoreTheme();
  }, []);

  return (
    <Button
      {...props}
      type="button"
      variant="secondary"
      iconOnly
      className="theme-toggle"
      aria-label="Light theme"
      aria-pressed={theme === 'light'}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Icon name="moon" size={18} />
    </Button>
  );
}
