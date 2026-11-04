import { CliError, findItem } from './registry.mjs';

/**
 * Resolves items and their registry dependencies transitively.
 * Dependencies come before dependents; ties are alphabetical, so output is stable.
 */
export function resolveItems(registry, names) {
  const order = [];
  const seen = new Set();
  const visit = (name, chain) => {
    if (seen.has(name)) return;
    if (chain.includes(name)) throw new CliError(`Dependency cycle: ${[...chain, name].join(' -> ')}`);
    const item = findItem(registry, name);
    for (const dep of [...item.registryDependencies].sort()) visit(dep, [...chain, name]);
    seen.add(name);
    order.push(item);
  };
  for (const n of names) visit(n, []);
  return order;
}

export function filterByTier(registry, tiers) {
  return registry.items.filter((i) => !tiers || tiers.includes(i.tier)).map((i) => i.name).sort();
}

export function frameworkFiles(item, framework) {
  if (framework === 'html') {
    // Recipes, plus the self-contained element bundles (plain JS, usable without a framework).
    const elements = (item.files.angular ?? []).filter((f) => f.kind === 'element');
    return [...item.files.html, ...elements];
  }
  return item.files[framework] ?? [];
}
