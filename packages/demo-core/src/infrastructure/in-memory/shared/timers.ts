/**
 * The host's timers (browsers, Node). demo-core typechecks against ES2022 only, which does not declare
 * them. Every call looks the timer up on `globalThis`, so fake timers installed later still apply.
 */
declare const timerHandle: unique symbol;

/** Opaque timer id: a number in browsers, an object in Node. */
export type TimerHandle = { readonly [timerHandle]: true };

interface HostTimers {
  setTimeout(callback: () => void, ms: number): TimerHandle;
  setInterval(callback: () => void, ms: number): TimerHandle;
  clearInterval(timer: TimerHandle): void;
}

const host = globalThis as unknown as HostTimers;

export function setTimeout(callback: () => void, ms: number): TimerHandle {
  return host.setTimeout(callback, ms);
}

export function setInterval(callback: () => void, ms: number): TimerHandle {
  return host.setInterval(callback, ms);
}

export function clearInterval(timer: TimerHandle): void {
  host.clearInterval(timer);
}
