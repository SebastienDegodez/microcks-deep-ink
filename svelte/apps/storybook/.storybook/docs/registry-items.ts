/// <reference types="vite/client" />
// Registry items read at build time from packages/registry/items/*.json (read-only), keyed by item name.

export type RegistryTier = 'natural' | 'microcks' | 'element';

export interface RegistryItemDoc {
  name: string;
  title: string;
  tier: RegistryTier;
  description: string;
  /** Storybook titles that document the item ("Components/Button"). */
  stories?: string[];
  a11y?: { pattern: string; keyboard: string[][]; aria: string[]; rgaa: string[]; wcag: string[]; notes?: string };
}

const modules = import.meta.glob<RegistryItemDoc>('../../../../../packages/registry/items/*.json', { eager: true, import: 'default' });

const byName = new Map<string, RegistryItemDoc>(Object.values(modules).map((item) => [item.name, item]));

export function registryItem(name: string | undefined): RegistryItemDoc | undefined {
  return name ? byName.get(name) : undefined;
}

/** Every item of a tier, sorted by title: the lists of the Usage pages are generated from the registry. */
export function itemsOfTier(tier: RegistryTier): RegistryItemDoc[] {
  return [...byName.values()].filter((item) => item.tier === tier).sort((a, b) => a.title.localeCompare(b.title));
}

/** The item documented on a Docs page: `parameters.deepInk.item`, else the first of `parameters.deepInk.items`. */
export function itemNameOf(parameters: Record<string, unknown> | undefined): string | undefined {
  const deepInk = parameters?.deepInk as { item?: string | null; items?: string[] } | undefined;
  if (!deepInk) return undefined;
  if (deepInk.item !== undefined) return deepInk.item ?? undefined;
  return deepInk.items?.[0];
}
