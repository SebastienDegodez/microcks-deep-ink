// Paths of the common inputs, reached through the `link:` devDependencies (built by `pnpm build` at the repo root).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PKG = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SRC = join(PKG, 'src');
export const DIST = join(PKG, 'dist');
export const REGISTRY = join(PKG, 'node_modules', '@microcks-deep-ink', 'registry');
export const CORE_ELEMENTS = join(PKG, 'node_modules', '@microcks-deep-ink', 'core', 'dist', 'elements');
