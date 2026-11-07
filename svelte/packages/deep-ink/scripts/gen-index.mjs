#!/usr/bin/env node
// Generates src/lib/index.ts, the package barrel, from the registry items (items/*.json). An item is exported once
// its folder src/lib/<item>/ exists (items without it are pending, listed by --pending):
//   - every PascalCase `<Name>.svelte` file  -> `export { default as <Name> } from './<item>/<Name>.svelte';`
//     (the file name is the export name: keep React's names, e.g. table/DataTable.svelte);
//   - every other `.ts` / `.svelte.ts` module (helpers, types) -> `export * from './<item>/<module>.js';`
// Specs, tests, `.d.ts` and lowercase or `_`-prefixed .svelte files (private parts) are skipped.
//
//   node scripts/gen-index.mjs           write src/lib/index.ts
//   node scripts/gen-index.mjs --check   exit 1 if src/lib/index.ts is not up to date
//   node scripts/gen-index.mjs --pending list the registry items with no Svelte implementation yet
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIB, REGISTRY } from './paths.mjs';

const HEADER = '// Generated from packages/registry/items by scripts/gen-index.mjs. Do not edit.';

/** Registry items that have a component API (cssOnly items such as base or tokens have none), sorted. */
export function items() {
  return readdirSync(join(REGISTRY, 'items'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(REGISTRY, 'items', f), 'utf8')))
    .filter((m) => !m.cssOnly)
    .map((m) => m.name)
    .sort();
}

const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

/** The barrel lines of one item folder: components first (sorted), then modules (sorted). */
export function itemExports(name, lib = LIB) {
  const files = readdirSync(join(lib, name)).sort();
  const components = files.filter((f) => /^[A-Z][A-Za-z0-9]*\.svelte$/.test(f));
  const modules = files.filter((f) => /\.ts$/.test(f) && !/\.(spec|test|d)\.ts$/.test(f));
  if (components.length === 0 && modules.length === 0) throw new Error(`src/lib/${name}/: no PascalCase .svelte component nor .ts module`);
  return [
    ...components.map((f) => `export { default as ${f.replace(/\.svelte$/, '')} } from './${name}/${f}';`),
    ...modules.map((f) => `export * from './${name}/${f.replace(/\.ts$/, '.js')}';`),
  ];
}

export function barrel(lib = LIB) {
  const known = items();
  const unknown = readdirSync(lib).filter((d) => isDir(join(lib, d)) && !known.includes(d));
  if (unknown.length) throw new Error(`src/lib/${unknown[0]}/ is not a registry item (packages/registry/items/${unknown[0]}.json)`);
  const lines = [HEADER];
  for (const name of known) if (isDir(join(lib, name))) lines.push(...itemExports(name, lib));
  // A barrel with no item yet must still be a module.
  if (lines.length === 1) lines.push('export {};');
  return lines.join('\n') + '\n';
}

export function pending(lib = LIB) {
  return items().filter((name) => !isDir(join(lib, name)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const path = join(LIB, 'index.ts');
  if (process.argv.includes('--pending')) {
    const todo = pending();
    console.log(`${items().length - todo.length}/${items().length} items done; pending:\n${todo.join('\n')}`);
  } else if (process.argv.includes('--check')) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== barrel()) {
      console.error('src/lib/index.ts is out of date: run `pnpm gen:index`');
      process.exit(1);
    }
  } else {
    const text = barrel();
    writeFileSync(path, text);
    console.log(`src/lib/index.ts: ${text.split('\n').length - 2} export lines`);
  }
}
