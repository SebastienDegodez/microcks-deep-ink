// Paths of the common inputs, reached through the `link:` devDependency (built by `pnpm build` at the repo root).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const LIB = join(PKG, 'src', 'lib');
export const DIST = join(PKG, 'dist');
export const REGISTRY = join(PKG, 'node_modules', '@microcks-deep-ink', 'registry');
export const PARITY = join(REGISTRY, 'parity');
