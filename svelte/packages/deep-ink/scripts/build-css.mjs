#!/usr/bin/env node
// Copies the layered Deep Ink stylesheet built by packages/registry (dist/deep-ink.css and its no-fonts variant)
// to dist/styles.css and dist/styles.no-fonts.css. Zero dependencies.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FROM = join(PKG, 'node_modules', '@microcks-deep-ink', 'registry', 'dist');
const OUT = join(PKG, 'dist');

mkdirSync(OUT, { recursive: true });
for (const [src, dest] of [['deep-ink.css', 'styles.css'], ['deep-ink.no-fonts.css', 'styles.no-fonts.css']]) {
  if (!existsSync(join(FROM, src))) {
    console.error(`missing ${join(FROM, src)}: run \`pnpm build\` at the repo root first`);
    process.exit(1);
  }
  copyFileSync(join(FROM, src), join(OUT, dest));
}
console.log('@microcks/deep-ink (svelte): dist/styles.css, dist/styles.no-fonts.css');
