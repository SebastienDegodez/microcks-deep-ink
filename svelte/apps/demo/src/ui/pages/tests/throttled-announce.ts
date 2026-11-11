import { useAnnounce } from '@/ui/app';

/**
 * `announce(message)` through the shell's polite live region, at most once every `minIntervalMs`
 * (2 s for streaming progress, 5 s for Live traces). Messages that arrive in between are dropped,
 * except `force`, which always goes through (a final result must never be lost).
 * Call it during component initialisation: it reads the shell's announcer from the context.
 */
export function useThrottledAnnounce(minIntervalMs: number): (message: string, force?: boolean) => void {
  const announce = useAnnounce();
  let last = 0;
  return (message: string, force = false) => {
    const now = Date.now();
    if (!force && now - last < minIntervalMs) return;
    last = now;
    announce(message);
  };
}
