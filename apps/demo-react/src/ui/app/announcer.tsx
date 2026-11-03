import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Announce = (message: string) => void;
const AnnouncerContext = createContext<Announce>(() => undefined);

/**
 * The shell's polite live region. Everything announced to screen readers goes through it: route
 * changes (`usePageTitle`), result counts after filtering, "Copied", streaming progress summaries...
 *
 * Throttle frequent messages at the call site (the contract allows at most one announcement every
 * 2 s for streaming progress and every 5 s for Live traces).
 */
export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const announce = useCallback<Announce>((text) => {
    // Clear first so announcing the same text twice is still read.
    setMessage('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(text), 50);
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-region">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

/** Returns `announce(message)`: a polite announcement through the shell's live region. */
export function useAnnounce(): Announce {
  return useContext(AnnouncerContext);
}
