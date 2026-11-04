#!/usr/bin/env node
// Copies the self-contained element bundles built by packages/core (dist/elements/*.js and their .d.ts) into
// src/elements (gitignored), where the wrappers import them and the build bundles them.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CORE_ELEMENTS, SRC } from './paths.mjs';

if (!existsSync(CORE_ELEMENTS)) {
  console.error(`missing ${CORE_ELEMENTS}: run \`pnpm build\` at the repo root first`);
  process.exit(1);
}
const dest = join(SRC, 'elements');
mkdirSync(dest, { recursive: true });
const files = readdirSync(CORE_ELEMENTS).filter((f) => /\.(js|d\.ts)$/.test(f));
for (const f of files) copyFileSync(join(CORE_ELEMENTS, f), join(dest, f));
console.log(`src/elements: ${files.length} files`);
