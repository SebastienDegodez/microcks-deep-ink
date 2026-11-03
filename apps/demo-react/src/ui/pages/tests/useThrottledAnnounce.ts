import { useCallback, useRef } from 'react';
import { useAnnounce } from '@/ui/app';

/**
 * `announce(message)` through the shell's polite live region, at most once every `minIntervalMs`
 * (2 s for streaming progress, 5 s for Live traces). Messages that arrive in between are dropped,
 * except `force`, which always goes through (a final result must never be lost).
 */
export function useThrottledAnnounce(minIntervalMs: number): (message: string, force?: boolean) => void {
  const announce = useAnnounce();
  const last = useRef(0);
  return useCallback(
    (message: string, force = false) => {
      const now = Date.now();
      if (!force && now - last.current < minIntervalMs) return;
      last.current = now;
      announce(message);
    },
    [announce, minIntervalMs],
  );
}
