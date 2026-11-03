/**
 * Theme handling, same contract as the `theme-toggle` registry item (`theme.ts`):
 * key `microcks-theme`, `document.documentElement.dataset.theme`, event `microcks-theme-change`.
 * Kept here so the shell works before the registry items are copied in; it can be replaced by the
 * copied file without changing the callers.
 */
export type Theme = 'dark' | 'light';

export const THEME_KEY = 'microcks-theme';
export const THEME_EVENT = 'microcks-theme-change';

function readStored(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function getTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  return attr === 'light' || attr === 'dark' ? attr : 'dark';
}

export function setTheme(theme: Theme, persist = true): void {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable: the theme still applies for this visit */
    }
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
}

/** Call once at boot, before the first render: stored choice, otherwise dark. */
export function restoreTheme(): Theme {
  const theme = readStored() ?? 'dark';
  setTheme(theme, false);
  return theme;
}

export function subscribeTheme(listener: (theme: Theme) => void): () => void {
  const handler = () => listener(getTheme());
  window.addEventListener(THEME_EVENT, handler);
  return () => window.removeEventListener(THEME_EVENT, handler);
}
