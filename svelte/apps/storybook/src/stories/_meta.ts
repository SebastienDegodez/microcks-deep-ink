// Shared helper for the story metas. Every meta declares what the Copy panel shows
// (`parameters.deepInk.items`); the Docs page (.storybook/docs) documents the first item from the registry.

/**
 * Parameters shared by every story file: what the Copy panel shows (`deepInk.items`) and the intro. The Docs page
 * adds the description, keyboard and ARIA contract of `deepInk.item` (default: the first item) from the registry. Used as `parameters: itemParams([...])` because Storybook needs the
 * default export to be an object literal.
 */
export function itemParams(items: string[], intro?: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    deepInk: { items },
    ...(intro ? { docs: { description: { component: intro } } } : {}),
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
