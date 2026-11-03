export type Theme = 'dark' | 'light';

const KEY = 'microcks-theme';

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme, persist = true): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* storage may be unavailable */
    }
  }
  document.dispatchEvent(new CustomEvent('mkThemeChange', { detail: theme }));
}

export function restoreTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved, false);
      return saved;
    }
  } catch {
    /* ignore */
  }
  return getTheme();
}
