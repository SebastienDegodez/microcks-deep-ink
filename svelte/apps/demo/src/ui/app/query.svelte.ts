import { untrack } from 'svelte';
import type { Unsubscribe } from '@microcks/demo-core/application/shared';

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Returns a getter whose value is a new object exactly when `deps()` change (compared with `Object.is`).
 * Effects read it, which gives them an explicit dependency list: reading other state inside the
 * query or the subscription does not re-run them.
 */
function depsOwner(deps: () => readonly unknown[]): () => object {
  let previous: readonly unknown[] | undefined;
  let owner: object = {};
  const current = $derived.by(() => {
    const next = deps();
    if (previous === undefined || !sameDeps(previous, next)) {
      previous = next;
      owner = {};
    }
    return owner;
  });
  return () => current;
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
 * Runs an async use case and tracks `{status, data, error}`. Call it while the component initialises
 * and read the fields where they are used (`query.status`, `query.data`): never destructure them.
 *
 * - Re-runs when `deps()` change or when `reload()` is called. `fn` itself is not tracked.
 * - A response that arrives after the deps changed (or after unmount) is ignored.
 * - While reloading, `data` keeps the last successful value so pages can avoid layout jumps; set
 *   `aria-busy` on the container while `status === 'loading'`.
 *
 * @example
 * ```ts
 * const params = useParams();
 * const service = useQuery(() => uc.catalog.getService(params.serviceId ?? ''), () => [params.serviceId]);
 * ```
 */
export function useQuery<T>(fn: () => Promise<T>, deps: () => readonly unknown[] = () => []): QueryResult<T> {
  let version = $state(0);
  let settled = $state.raw<Settled<T> | null>(null);
  let lastData = $state.raw<T | undefined>(undefined);
  // A fresh object identity per (deps, version): the "request owner".
  const owner = depsOwner(() => [...deps(), version]);

  $effect(() => {
    const current = owner();
    let cancelled = false;
    untrack(fn).then(
      (data) => {
        if (cancelled) return;
        lastData = data;
        settled = { owner: current, state: { status: 'success', data } };
      },
      (error: unknown) => {
        if (cancelled) return;
        settled = { owner: current, state: { status: 'error', error: error instanceof Error ? error : new Error(String(error)) } };
      },
    );
    return () => {
      cancelled = true;
    };
  });

  const reload = () => {
    version += 1;
  };

  const state = $derived.by((): QueryState<T> => {
    const current = owner();
    if (settled && settled.owner === current) {
      return settled.state.status === 'success'
        ? { status: 'success', data: settled.state.data, error: undefined }
        : { status: 'error', data: lastData, error: settled.state.error };
    }
    return { status: 'loading', data: lastData, error: undefined };
  });

  return {
    get status() {
      return state.status;
    },
    get data() {
      return state.data;
    },
    get error() {
      return state.error;
    },
    reload,
  } as QueryResult<T>;
}

export interface SubscriptionOptions<T, R> {
  /** Value before the first event. */
  initial: R;
  /** Folds an event into the value (keep the last N calls, append a step...). Defaults to "latest event". */
  reduce?: (current: R, event: T) => R;
}

export interface SubscriptionResult<R> {
  /** Current value; frozen while paused. */
  readonly value: R;
  readonly paused: boolean;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  /** Back to `initial` (the "Clear" button of Live traces). */
  clear: () => void;
}

/**
 * Subscribes to a stream (`subscribe(listener) => Unsubscribe`) for the lifetime of the component, and
 * again whenever `deps()` change. `subscribe` may return `undefined` to stay idle (a run that is not
 * live). Options can be a getter: they are read when an event arrives, never tracked.
 *
 * Moving content needs a Pause control (RGAA 13.8): `pause()` freezes `value` while the stream keeps
 * running underneath, `resume()` jumps to the latest value.
 */
export function useSubscription<T, R = T | undefined>(
  subscribe: ((listener: (event: T) => void) => Unsubscribe | undefined) | undefined,
  deps: () => readonly unknown[] = () => [],
  options: SubscriptionOptions<T, R> | (() => SubscriptionOptions<T, R>) = { initial: undefined as R },
): SubscriptionResult<R> {
  const readOptions = () => untrack(() => (typeof options === 'function' ? options() : options));
  const initial = readOptions().initial;
  let latest = $state.raw<R>(initial);
  let frozen = $state.raw<{ value: R } | null>(null);
  let current: R = initial;
  const owner = depsOwner(deps);

  $effect(() => {
    owner();
    return untrack(() =>
      subscribe?.((event) => {
        const { reduce } = readOptions();
        current = reduce ? reduce(current, event) : (event as unknown as R);
        latest = current;
      }),
    );
  });

  return {
    get value() {
      return frozen ? frozen.value : latest;
    },
    get paused() {
      return frozen !== null;
    },
    pause: () => {
      frozen = { value: current };
    },
    resume: () => {
      frozen = null;
    },
    toggle: () => {
      frozen = untrack(() => frozen) ? null : { value: current };
    },
    clear: () => {
      current = readOptions().initial;
      latest = current;
      frozen = untrack(() => frozen) ? { value: current } : null;
    },
  };
}
