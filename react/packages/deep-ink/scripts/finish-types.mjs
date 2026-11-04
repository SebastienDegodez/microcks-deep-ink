#!/usr/bin/env node
// Completes the declarations emitted by tsc in dist/:
// - copies the hand-written .d.ts of the element bundles next to dist/elements/*.js (tsc does not emit them);
// - adds the `.js` extension to relative specifiers (`'./icon'` -> `'./icon.js'`), so that the types resolve under
//   Node's ESM resolution too, not only in bundlers. The JavaScript emitted by Vite already has them.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, SRC } from './paths.mjs';

mkdirSync(join(DIST, 'elements'), { recursive: true });
for (const f of readdirSync(join(SRC, 'elements')).filter((n) => n.endsWith('.d.ts'))) copyFileSync(join(SRC, 'elements', f), join(DIST, 'elements', f));

const withExt = (dir, spec) => (/\.(js|css|json)$/.test(spec) || !existsSync(join(dir, `${spec}.d.ts`)) ? spec : `${spec}.js`);
let fixed = 0;
for (const f of readdirSync(DIST).filter((n) => n.endsWith('.d.ts'))) {
  const path = join(DIST, f);
  const text = readFileSync(path, 'utf8');
  const next = text.replace(/((?:from|import)\s*\(?\s*)(['"])(\.\.?\/[^'"]+)\2/g, (_, pre, q, spec) => `${pre}${q}${withExt(DIST, spec)}${q}`);
  if (next !== text) {
    writeFileSync(path, next);
    fixed++;
  }
}
console.log(`dist: element types copied, ${fixed} declaration files with .js specifiers`);
