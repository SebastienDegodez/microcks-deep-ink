/* The `deps` arrays of these hooks are dynamic by design (same contract as useEffect/useMemo callers). */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Unsubscribe } from '@/application/shared';

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Returns an object whose identity changes exactly when `deps` change (compared with `Object.is`).
 * Effects depend on it, which gives `useEffect` a dynamic dependency list without the lint escape hatch.
 */
function useDepsOwner(deps: readonly unknown[]): object {
  const [state, setState] = useState<{ deps: readonly unknown[]; owner: object }>(() => ({ deps, owner: {} }));
  if (sameDeps(state.deps, deps)) return state.owner;
  // Derived state: React re-renders immediately with the new value.
  const next = { deps, owner: {} };
  setState(next);
  return next.owner;
}

export type QueryState<T> =
  | { status: 'loading'; data: T | undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: T | undefined; error: Error };

export type QueryResult<T> = QueryState<T> & {
  /** Runs the query again. The previous data stays available while `status` is `loading`. */
  reload: () => void;
};

interface Settled<T> {
  owner: object;
  state: { status: 'success'; data: T } | { status: 'error'; error: Error };
}

/**
 * Runs an async use case and tracks `{status, data, error}`.
 *
 * - Re-runs when `deps` change or when `reload()` is called.
 * - A response that arrives after the deps changed (or after unmount) is ignored.
 * - While reloading, `data` keeps the last successful value so pages can avoid layout jumps; set
 *   `aria-busy` on the container while `status === 'loading'`.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: readonly unknown[]): QueryResult<T> {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [lastData, setLastData] = useState<T | undefined>(undefined);
  // A fresh object identity per (deps, version): the "request owner".
  const owner = useDepsOwner([...deps, version]);

  useEffect(() => {
    let cancelled = false;
    fn().then(
      (data) => {
        if (cancelled) return;
        setLastData(data);
        setSettled({ owner, state: { status: 'success', data } });
      },
      (error: unknown) => {
        if (cancelled) return;
        setSettled({ owner, state: { status: 'error', error: error instanceof Error ? error : new Error(String(error)) } });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [owner]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  if (settled && settled.owner === owner) {
    return settled.state.status === 'success'
      ? { status: 'success', data: settled.state.data, error: undefined, reload }
      : { status: 'error', data: lastData, error: settled.state.error, reload };
  }
  return { status: 'loading', data: lastData, error: undefined, reload };
}

export interface SubscriptionOptions<T, R> {
  /** Value before the first event. */
  initial: R;
  /** Folds an event into the value (keep the last N calls, append a step...). Defaults to "latest event". */
  reduce?: (current: R, event: T) => R;
}

export interface SubscriptionResult<R> {
  /** Current value; frozen while paused. */
  value: R;
  paused: boolean;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  /** Back to `initial` (the "Clear" button of Live traces). */
  clear: () => void;
}

/**
 * Subscribes to a stream (`subscribe(listener) => Unsubscribe`) for the lifetime of the component.
 *
 * Moving content needs a Pause control (RGAA 13.8): `pause()` freezes `value` while the stream keeps
 * running underneath, `resume()` jumps to the latest value.
 */
export function useSubscription<T, R = T | undefined>(
  subscribe: ((listener: (event: T) => void) => Unsubscribe) | undefined,
  deps: readonly unknown[],
  options: SubscriptionOptions<T, R> = { initial: undefined as R },
): SubscriptionResult<R> {
  const [latest, setLatest] = useState<R>(options.initial);
  const [frozen, setFrozen] = useState<{ value: R } | null>(null);
  const latestRef = useRef<R>(options.initial);
  const owner = useDepsOwner(deps);
  // Options are read through a ref so a new object literal per render does not re-subscribe.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!subscribe) return undefined;
    return subscribe((event) => {
      const { reduce } = optionsRef.current;
      latestRef.current = reduce ? reduce(latestRef.current, event) : (event as unknown as R);
      setLatest(latestRef.current);
    });
  }, [owner]);

  const pause = useCallback(() => setFrozen({ value: latestRef.current }), []);
  const resume = useCallback(() => setFrozen(null), []);
  const toggle = useCallback(() => setFrozen((f) => (f ? null : { value: latestRef.current })), []);
  const clear = useCallback(() => {
    latestRef.current = optionsRef.current.initial;
    setLatest(latestRef.current);
    setFrozen((f) => (f ? { value: latestRef.current } : null));
  }, []);

  return { value: frozen ? frozen.value : latest, paused: frozen !== null, pause, resume, toggle, clear };
}
