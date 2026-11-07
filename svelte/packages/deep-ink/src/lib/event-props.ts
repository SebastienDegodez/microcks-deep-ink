import type { DOMAttributes } from 'svelte/elements';
export type NativeHandlers<E extends EventTarget> = Pick<DOMAttributes<E>, Extract<keyof DOMAttributes<E>, `on${string}`>>;

/** Forward native Svelte DOM attributes without event-name or phase translation. */
export function eventProps<P extends Record<string, unknown>>(props: P): P {
  return props;
}
