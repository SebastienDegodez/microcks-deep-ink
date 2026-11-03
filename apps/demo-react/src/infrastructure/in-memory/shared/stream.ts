import type { Listener, Unsubscribe } from '@/application/shared';

/** Streams tick every 1200 ms, matching the prototypes. */
export const TICK_MS = 1200;

export interface Stream<T> {
  subscribe(listener: Listener<T>): Unsubscribe;
  emit(value: T): void;
  readonly size: number;
}

/** Minimal hot stream: `emit` pushes to every current subscriber. */
export function createStream<T>(): Stream<T> {
  const listeners = new Set<Listener<T>>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit(value) {
      for (const l of [...listeners]) l(value);
    },
    get size() {
      return listeners.size;
    },
  };
}

/**
 * A stream driven by a timer: `produce(n)` is called every `intervalMs` for each subscriber
 * (n counts from 0 per subscription). Return `undefined` to skip a tick. The timer stops when the
 * subscriber unsubscribes.
 */
export function createTickingStream<T>(
  produce: (tick: number) => T | undefined,
  options: { intervalMs?: number } = {},
): (listener: Listener<T>) => Unsubscribe {
  const interval = options.intervalMs ?? TICK_MS;
  return (listener) => {
    let tick = 0;
    const timer = setInterval(() => {
      const value = produce(tick);
      tick += 1;
      if (value !== undefined) listener(value);
    }, interval);
    return () => clearInterval(timer);
  };
}

/**
 * Replays a finite sequence one item per tick, then stops. The first item is emitted after one tick
 * unless `immediate` is set. Used for runs and test runs that "execute" step by step.
 */
export function createSequenceStream<T>(
  items: readonly T[],
  options: { intervalMs?: number; immediate?: boolean } = {},
): (listener: Listener<T>) => Unsubscribe {
  const interval = options.intervalMs ?? TICK_MS;
  return (listener) => {
    let index = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const step = () => {
      const item = items[index];
      index += 1;
      if (item !== undefined) listener(item);
      if (index >= items.length && timer !== undefined) clearInterval(timer);
    };
    if (options.immediate) step();
    if (index < items.length) timer = setInterval(step, interval);
    return () => {
      if (timer !== undefined) clearInterval(timer);
    };
  };
}
