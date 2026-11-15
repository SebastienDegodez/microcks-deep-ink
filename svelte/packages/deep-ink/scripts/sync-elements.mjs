import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const source = resolve(root, 'packages/core/dist/elements');
const destination = resolve(root, 'svelte/packages/deep-ink/src/lib/internal/elements');
if (!existsSync(source)) throw new Error('Build packages/core before building the Svelte package');
mkdirSync(destination, { recursive: true });
for (const name of ['plugin-slot', 'workflow-loom']) {
  for (const ext of ['js', 'd.ts']) copyFileSync(resolve(source, `${name}.${ext}`), resolve(destination, `${name}.${ext}`));
}
