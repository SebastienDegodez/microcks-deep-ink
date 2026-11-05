/// <reference types="vite/client" />
// Registry items read at build time from packages/registry/items/*.json (read-only), keyed by item name.

export interface RegistryItemDoc {
  name: string;
  title: string;
  description: string;
  a11y?: { pattern: string; keyboard: string[][]; aria: string[]; rgaa: string[]; wcag: string[]; notes?: string };
}

const modules = import.meta.glob<RegistryItemDoc>('../../../../../packages/registry/items/*.json', { eager: true, import: 'default' });

const byName = new Map<string, RegistryItemDoc>(Object.values(modules).map((item) => [item.name, item]));

export function registryItem(name: string | undefined): RegistryItemDoc | undefined {
  return name ? byName.get(name) : undefined;
}

/** The item documented on a Docs page: `parameters.deepInk.item`, else the first of `parameters.deepInk.items`. */
export function itemNameOf(parameters: Record<string, unknown> | undefined): string | undefined {
  const deepInk = parameters?.deepInk as { item?: string | null; items?: string[] } | undefined;
  if (!deepInk) return undefined;
  if (deepInk.item !== undefined) return deepInk.item ?? undefined;
  return deepInk.items?.[0];
}
