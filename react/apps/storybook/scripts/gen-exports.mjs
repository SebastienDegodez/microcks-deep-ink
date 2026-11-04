#!/usr/bin/env node
// Writes .storybook/copy-panel/exports.generated.json (gitignored): the value exports of every module of
// @microcks/deep-ink, keyed by module (= registry item) name, read from the package's dist/*.d.ts.
// The Copy panel uses it to show the import to write. Build the package first (`pnpm -C react build`).
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(APP, 'node_modules', '@microcks', 'deep-ink', 'dist');
if (!existsSync(join(DIST, 'index.d.ts'))) {
  console.error(`missing ${DIST}/index.d.ts: build the package first (pnpm -C react build)`);
  process.exit(1);
}
const map = {};
for (const f of readdirSync(DIST).filter((n) => n.endsWith('.d.ts') && n !== 'index.d.ts').sort()) {
  const text = readFileSync(join(DIST, f), 'utf8');
  const names = new Set();
  for (const [, n] of text.matchAll(/^export declare (?:function|const|class|let) (\w+)/gm)) names.add(n);
  for (const [, list] of text.matchAll(/^export \{([^}]+)\}(?: from '[^']+')?;/gm)) {
    for (const part of list.split(',')) {
      const t = part.trim();
      if (!t || t.startsWith('type ')) continue;
      names.add(t.split(/\s+as\s+/).pop());
    }
  }
  const item = f.replace(/\.d\.ts$/, '').split('.')[0];
  map[item] = [...new Set([...(map[item] ?? []), ...names])];
}
writeFileSync(join(APP, '.storybook', 'copy-panel', 'exports.generated.json'), JSON.stringify(map, null, 2) + '\n');
console.log(`copy panel: exports of ${Object.keys(map).length} modules`);
