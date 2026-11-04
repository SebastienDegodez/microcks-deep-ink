import { useEffect } from 'react';

/** Replays a run: calls `advance` every `ms` while `active`, and stops when it turns inactive or unmounts. */
export function useReplay(active: boolean, advance: () => void, ms: number): void {
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(advance, ms);
    return () => clearInterval(timer);
  }, [active, advance, ms]);
}
