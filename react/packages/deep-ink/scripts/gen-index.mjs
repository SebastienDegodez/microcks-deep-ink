#!/usr/bin/env node
// Generates src/index.ts, the package barrel, from the registry items (items/*.json): one `export *` per React
// source file of each item (the main file, then its `<name>.<part>.ts(x)` helpers such as theme-toggle.theme).
//
//   node scripts/gen-index.mjs           write src/index.ts
//   node scripts/gen-index.mjs --check   exit 1 if src/index.ts is not up to date
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGISTRY, SRC } from './paths.mjs';

export function barrel() {
  const items = readdirSync(join(REGISTRY, 'items'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(REGISTRY, 'items', f), 'utf8')))
    .filter((m) => !m.cssOnly)
    .map((m) => m.name)
    .sort();
  const files = readdirSync(SRC).filter((f) => /\.(tsx?)$/.test(f) && !/\.(spec|stories|d)\./.test(f) && f !== 'index.ts');
  const lines = ['// Generated from packages/registry/items by scripts/gen-index.mjs. Do not edit.'];
  for (const name of items) {
    const own = files
      .filter((f) => new RegExp(`^${name}(\\.[a-z0-9-]+)*\\.tsx?$`).test(f))
      .map((f) => f.replace(/\.tsx?$/, ''))
      .sort((a, b) => Number(b === name) - Number(a === name) || a.localeCompare(b));
    if (!own.includes(name)) throw new Error(`${name}: no src/${name}.tsx`);
    for (const f of own) lines.push(`export * from './${f}';`);
  }
  return lines.join('\n') + '\n';
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const text = barrel();
  const path = join(SRC, 'index.ts');
  if (process.argv.includes('--check')) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== text) {
      console.error('src/index.ts is out of date: run `node scripts/gen-index.mjs`');
      process.exit(1);
    }
  } else {
    writeFileSync(path, text);
    console.log(`src/index.ts: ${text.split('\n').length - 2} modules`);
  }
}
