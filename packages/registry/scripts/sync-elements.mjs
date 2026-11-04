#!/usr/bin/env node
// Copies the self-contained element bundles built by packages/core next to the
// framework sources, where the build discovers them. The destination folders
// (react/packages/deep-ink/src/elements, packages/registry/src/angular/elements) are gitignored.
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PKG_ROOT = resolve(HERE, '..');
export const CORE_ELEMENTS = resolve(PKG_ROOT, '..', 'core', 'dist', 'elements');
/** The React sources live in the React workspace (react/packages/deep-ink/src); Angular, HTML and CSS stay here. */
export const REACT_SRC = resolve(PKG_ROOT, '..', '..', 'react', 'packages', 'deep-ink', 'src');
const FRAMEWORKS = ['react', 'angular'];

/** Source folder of a framework for a registry root: the real React package for this registry, src/<fw> otherwise. */
export function sourceDir(root, framework) {
  if (framework === 'react' && resolve(root) === PKG_ROOT) return REACT_SRC;
  return join(root, 'src', framework);
}

/**
 * @param {{ tags: string[], coreElements?: string, root?: string }} options
 * @returns {{ copied: string[], missing: string[] }} tags copied / tags without a bundle in core
 */
export function syncElements({ tags, coreElements = CORE_ELEMENTS, root = PKG_ROOT }) {
  const copied = [];
  const missing = [];
  for (const fw of FRAMEWORKS) {
    const dest = join(sourceDir(root, fw), 'elements');
    // Remove stale bundles of tags that no item declares any more.
    if (existsSync(dest)) {
      for (const f of readdirSync(dest)) {
        const tag = f.replace(/(\.d)?\.(js|ts)$/, '');
        if (!tags.includes(tag)) rmSync(join(dest, f), { force: true });
      }
    }
  }
  for (const tag of tags) {
    const js = join(coreElements, `${tag}.js`);
    if (!existsSync(js)) {
      missing.push(tag);
      continue;
    }
    for (const fw of FRAMEWORKS) {
      const dest = join(sourceDir(root, fw), 'elements');
      mkdirSync(dest, { recursive: true });
      copyFileSync(js, join(dest, `${tag}.js`));
      const dts = join(coreElements, `${tag}.d.ts`);
      if (existsSync(dts)) copyFileSync(dts, join(dest, `${tag}.d.ts`));
    }
    copied.push(tag);
  }
  return { copied, missing };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tags = process.argv.slice(2);
  if (tags.length === 0) {
    console.error('usage: node scripts/sync-elements.mjs <tag>...');
    process.exit(1);
  }
  const { copied, missing } = syncElements({ tags });
  for (const t of copied) console.log(`synced  ${t}`);
  for (const t of missing) console.warn(`missing ${t} (build packages/core first)`);
  process.exit(missing.length ? 1 : 0);
}
