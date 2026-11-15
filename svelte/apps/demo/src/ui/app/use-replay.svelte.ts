/**
 * Replays a run: calls `advance` every `ms` while `active()`, and stops when it turns inactive or the
 * component unmounts.
 */
export function useReplay(active: () => boolean, advance: () => void, ms: number | (() => number)): void {
  $effect(() => {
    if (!active()) return undefined;
    const timer = setInterval(advance, typeof ms === 'function' ? ms() : ms);
    return () => clearInterval(timer);
  });
}
