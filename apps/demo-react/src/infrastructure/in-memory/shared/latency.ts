const KEY = 'deep-ink-demo-fast';
let forced: 'fast' | 'normal' | undefined;
let sequence = 0;

/** Forces the latency mode (tests, Storybook). `undefined` goes back to auto-detection. */
export function setLatencyMode(mode: 'fast' | 'normal' | undefined): void {
  forced = mode;
}

/**
 * Fast mode removes the simulated latency (used by the Playwright smoke run):
 * `#/anything?fast` in the hash query, or `localStorage['deep-ink-demo-fast'] = '1'`,
 * and always under Vitest.
 */
export function isFastMode(): boolean {
  if (forced) return forced === 'fast';
  if (import.meta.env.MODE === 'test') return true;
  try {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const query = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
      if (new URLSearchParams(query).has('fast')) return true;
      if (window.localStorage.getItem(KEY) === '1') return true;
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
