/**
 * Helpers shared by the port contract suites (`<feature>.contract.ts`).
 *
 * A contract suite describes the observable behaviour of a feature's ports through their interface only. It is run
 * against every implementation: the in-memory adapters (the reference, `src/infrastructure/in-memory/<feature>`)
 * and the HTTP adapters answered by MSW (`src/infrastructure/http/port-contracts.test.ts`).
 */
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { NotFoundError, ValidationError, type Listener, type Unsubscribe } from '@/application/shared';

/** Builds a fresh set of adapters (one per test, so mutations never leak between tests). */
export type MakeAdapters<T> = () => T;

/** A contract suite: `describe<Feature>PortContract(name, makeAdapters)`. */
export type PortContract<T> = (name: string, makeAdapters: MakeAdapters<T>) => void;

/**
 * Returns a getter for the adapters of the current test. They are built lazily on first access, so a nested
 * `useFakeTimers()` (registered after this hook) is already active when time-based adapters are created.
 */
export function useAdapters<T>(makeAdapters: MakeAdapters<T>): () => T {
  let current: T | undefined;
  beforeEach(() => {
    current = undefined;
  });
  return () => {
    current ??= makeAdapters();
    return current;
  };
}

/** Captured before any test fakes the timers: `settle()` needs real macrotasks. */
const realSetTimeout = globalThis.setTimeout;

/**
 * Lets in-flight asynchronous work finish (an HTTP adapter's request answered by MSW takes a few real macrotasks),
 * without moving the fake clock.
 */
export async function settle(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await new Promise<void>((resolve) => realSetTimeout(resolve, 0));
}

/**
 * Fake timers (and `Date`, at the demo clock) for the stream tests of the enclosing `describe`. Only timeouts,
 * intervals and `Date` are faked: `fetch` and MSW keep their real `setImmediate`/microtasks, so HTTP adapters work.
 */
export function useFakeTimers(): void {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-11-03T09:10:04Z'), toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}

/** Subscribes, lets `ms` of fake time pass (then the work it started settle), and returns what was emitted plus the `Unsubscribe`. */
export async function collect<T>(subscribe: (listener: Listener<T>) => Unsubscribe, ms: number): Promise<{ values: T[]; unsubscribe: Unsubscribe }> {
  const values: T[] = [];
  const unsubscribe = subscribe((value) => values.push(value));
  await vi.advanceTimersByTimeAsync(ms);
  await settle();
  return { values, unsubscribe };
}

/** Unsubscribes and asserts that no value arrives during `ms` more of fake time. */
export async function expectSilentAfterUnsubscribe<T>(values: T[], unsubscribe: Unsubscribe, ms: number): Promise<void> {
  const count = values.length;
  unsubscribe();
  await vi.advanceTimersByTimeAsync(ms);
  await settle();
  expect(values).toHaveLength(count);
}

/** Asserts that the promise rejects with the domain `NotFoundError`. */
export async function expectNotFound(promise: Promise<unknown>): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(NotFoundError);
}

/** Asserts that the promise rejects with the domain `ValidationError`. */
export async function expectValidationError(promise: Promise<unknown>): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(ValidationError);
}
