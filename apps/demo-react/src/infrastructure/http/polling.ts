import type { Listener, Unsubscribe } from '@/application/shared';

export interface PollingOptions<T> {
  /** Pause between the end of a poll and the start of the next one. */
  intervalMs: number;
  /** Position of an item in the feed: the next poll asks for the items after the last emitted one. */
  seq: (item: T) => number;
  /** Polls once right away instead of after `intervalMs`. */
  immediate?: boolean;
  /** The feed ends with this item: no further poll. */
  isLast?: (item: T) => boolean;
  /** An error that ends the feed (e.g. the watched resource does not exist): no further poll. Others are skipped. */
  isFatal?: (error: unknown) => boolean;
}

/**
 * A stream that polls `fetchAfter(<seq of the last emitted item>, signal)` and emits what it returns, in order.
 * Self-scheduling: the next poll is scheduled `intervalMs` after the previous one SETTLES, so at most one request is
 * in flight and a stall (slow answer, throttled tab) never triggers a burst of catch-up requests: missed ticks are
 * skipped, the stream simply resumes from the last seq. A failed poll is skipped the same way (unless `isFatal`).
 * Unsubscribing clears the pending tick and aborts the request in flight (its answer, if any, is dropped).
 */
export function pollingStream<T>(fetchAfter: (after: number | undefined, signal: AbortSignal) => Promise<readonly T[]>, options: PollingOptions<T>) {
  const { intervalMs, seq, immediate = false, isLast = () => false, isFatal = () => false } = options;
  return (listener: Listener<T>): Unsubscribe => {
    let after: number | undefined;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const poll = async () => {
      timer = undefined;
      try {
        const items = await fetchAfter(after, controller.signal);
        for (const item of items) {
          if (stopped) return;
          after = seq(item);
          listener(item);
          if (isLast(item)) stopped = true;
        }
      } catch (error) {
        // Skipped: the next tick asks again from the same seq.
        if (isFatal(error)) stopped = true;
      }
      if (!stopped) timer = setTimeout(poll, intervalMs);
    };
    if (immediate) void poll();
    else timer = setTimeout(poll, intervalMs);
    return () => {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      controller.abort();
    };
  };
}
