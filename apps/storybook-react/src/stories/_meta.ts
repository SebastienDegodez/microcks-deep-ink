// Shared helper for the story metas. Every meta declares what the Copy panel shows
// (`parameters.deepInk.items`) and documents keyboard + ARIA from the registry (`a11yDoc`).
import { a11yDoc } from '../../../shared/copy-panel/a11y-doc';

/**
 * Parameters shared by every story file: what the Copy panel shows (`deepInk.items`) and the keyboard + ARIA
 * documentation taken from the registry. Used as `parameters: itemParams([...])` because Storybook needs the
 * default export to be an object literal.
 */
export function itemParams(items: string[], intro?: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    deepInk: { items },
    docs: { description: { component: [intro, a11yDoc(items[0])].filter(Boolean).join('\n\n') } },
    ...extra,
  };
}

/**
 * The element wrappers call back with either the DOM CustomEvent or its detail, depending on the wrapper version.
 * Stories accept both, so they do not depend on that choice.
 */
export function detailOf<T>(e: unknown): T {
  const maybe = e as { detail?: T } | null;
  return (maybe && typeof maybe === 'object' && 'detail' in maybe && maybe.detail !== undefined ? maybe.detail : e) as T;
}
