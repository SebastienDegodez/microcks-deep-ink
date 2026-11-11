import { setTimeout } from './timers.js';

const KEY = 'deep-ink-demo-fast';
let forced: 'fast' | 'normal' | undefined;
let defaultMode: 'fast' | 'normal' = 'normal';
let sequence = 0;

/** The page APIs fast mode reads; demo-core typechecks without the DOM library. */
interface Page {
  readonly location: { readonly hash: string };
  readonly localStorage: { getItem(key: string): string | null };
}

const host = globalThis as unknown as {
  readonly window?: Page;
  readonly URLSearchParams: new (query: string) => { has(name: string): boolean };
};

/** Forces the latency mode (tests, Storybook). `undefined` goes back to auto-detection. */
export function setLatencyMode(mode: 'fast' | 'normal' | undefined): void {
  forced = mode;
}

/**
 * Mode used when nothing forces one and the page does not ask for fast mode. Test setups set
 * `'fast'` once: demo-core knows no bundler, so it cannot detect the test runner itself.
 */
export function setDefaultLatencyMode(mode: 'fast' | 'normal'): void {
  defaultMode = mode;
}

/**
 * Fast mode removes the simulated latency (used by the Playwright smoke run):
 * `#/anything?fast` in the hash query, or `localStorage['deep-ink-demo-fast'] = '1'`,
 * and always under the test runners that set it as the default mode.
 */
export function isFastMode(): boolean {
  if (forced) return forced === 'fast';
  if (defaultMode === 'fast') return true;
  try {
    const page = host.window;
    if (page !== undefined) {
      const hash = page.location.hash;
      const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
      if (new host.URLSearchParams(query).has('fast')) return true;
      if (page.localStorage.getItem(KEY) === '1') return true;
    }
  } catch {
    /* storage can be blocked: stay in normal mode */
  }
  return false;
}

/** Deterministic delay, 120..350 ms, from a counter (no Math.random: runs are reproducible). */
export function nextLatencyMs(): number {
  sequence += 1;
  return 120 + ((sequence * 97) % 231);
}

/** Resolves after the simulated network latency. Every in-memory adapter awaits it once per call. */
export function latency(): Promise<void> {
  if (isFastMode()) return Promise.resolve();
  const ms = nextLatencyMs();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolves `value` after the simulated latency. */
export async function after<T>(value: T | (() => T)): Promise<T> {
  await latency();
  return typeof value === 'function' ? (value as () => T)() : value;
}
