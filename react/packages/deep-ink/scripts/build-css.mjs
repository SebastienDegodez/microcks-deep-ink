#!/usr/bin/env node
// Copies the layered stylesheet built by packages/registry (dist/deep-ink.css, tokens + base + every item, in the
// demo's cascade order) to dist/styles.css, and the no-fonts variant to dist/styles.no-fonts.css.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, REGISTRY } from './paths.mjs';

mkdirSync(DIST, { recursive: true });
for (const [src, dest] of [['deep-ink.css', 'styles.css'], ['deep-ink.no-fonts.css', 'styles.no-fonts.css']]) {
  const from = join(REGISTRY, 'dist', src);
  if (!existsSync(from)) {
    console.error(`missing ${from}: run \`pnpm build\` at the repo root first`);
    process.exit(1);
  }
  copyFileSync(from, join(DIST, dest));
}
console.log('dist/styles.css, dist/styles.no-fonts.css');
