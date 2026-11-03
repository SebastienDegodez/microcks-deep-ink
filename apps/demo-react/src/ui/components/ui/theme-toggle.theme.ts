// Deep Ink · theme-toggle@0.2.0 · copied from packages/registry. You own this file.
export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'microcks-theme';
export const THEME_EVENT = 'microcks-theme-change';

/** Current theme, read from `data-theme` on <html>. Dark is the default. */
export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Applies the theme to <html>, optionally persists it, and dispatches `microcks-theme-change`. */
export function setTheme(theme: Theme, persist = true): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* storage can be blocked: the theme still applies for this page */
    }
  }
  document.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

/** Applies the saved theme, if any, without writing it back. Returns the active theme. */
export function restoreTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved, false);
      return saved;
    }
  } catch {
    /* ignore */
  }
  return getTheme();
}
