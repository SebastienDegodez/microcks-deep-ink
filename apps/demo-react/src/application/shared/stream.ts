export type Unsubscribe = () => void;
export type Listener<T> = (value: T) => void;

/**
 * Stream contract: `subscribe(listener)` returns an `Unsubscribe`. Streams tick at 1200 ms in the
 * in-memory adapters (as in the prototypes). Pages use `useSubscription`.
 */
export type Subscribe<T> = (listener: Listener<T>) => Unsubscribe;
