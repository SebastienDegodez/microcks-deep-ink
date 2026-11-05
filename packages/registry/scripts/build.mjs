#!/usr/bin/env node
// Builds the Deep Ink registry.
//
//   node scripts/build.mjs [--strict] [--quiet]
//
// Reads items/<name>.json, discovers source files by name (see README.md), validates
// everything and writes dist/registry.json, dist/registry.full.json and
// dist/deep-ink-components.css. Only writes inside packages/registry.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { CORE_ELEMENTS, PKG_ROOT, sourceDir, syncElements } from './sync-elements.mjs';

const TOKENS_DIST = resolve(PKG_ROOT, '..', 'tokens', 'dist');
// React is a package (@microcks/deep-ink, react/packages/deep-ink): it is not copied, so the registry has no React files.
const FRAMEWORKS = ['angular'];
const EXT = { angular: ['ts'], html: ['html'], css: ['css'] };

/** Header written at the top of every copied file. */
export function fileHeader(name, target, version) {
  const text = `Deep Ink · ${name}@${version} · copied from packages/registry. You own this file.`;
  if (target.endsWith('.css')) return `/* ${text} */\n`;
  if (target.endsWith('.html')) return `<!-- ${text} -->\n`;
  return `// ${text}\n`;
}

/**
 * Version of one item: a hash of the content of all its files (every framework, the CSS, the element bundles),
 * without the copy header. It changes when, and only when, what a consumer would copy changes.
 */
export function itemHash(files) {
  const h = createHash('sha256');
  for (const [key, content] of [...files].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
    h.update(`${key}\0${createHash('sha256').update(content).digest('hex')}\n`);
  }
  return h.digest('hex').slice(0, 16);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function discover(root, framework, name, extra = []) {
  const dir = sourceDir(root, framework);
  if (!existsSync(dir)) return [];
  const exts = EXT[framework].join('|');
  const re = new RegExp(`^${name}(\\.[a-z0-9-]+)*\\.(${exts})$`);
  const found = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && re.test(d.name) && !/\.(spec|stories)\./.test(d.name))
    .map((d) => d.name);
  for (const e of extra) if (existsSync(join(dir, e))) found.push(e);
  // Main file first, then alphabetical, so output is deterministic.
  const main = new RegExp(`^${name}\\.(${exts})$`);
  return [...new Set(found)].sort((a, b) => Number(main.test(b)) - Number(main.test(a)) || a.localeCompare(b));
}

function topoSort(items, errors) {
  const byName = new Map(items.map((i) => [i.name, i]));
  const order = [];
  const state = new Map(); // 1 = visiting, 2 = done
  const visit = (name, path) => {
    if (state.get(name) === 2) return;
    if (state.get(name) === 1) {
      errors.push(`dependency cycle: ${[...path.slice(path.indexOf(name)), name].join(' -> ')}`);
      return;
    }
    state.set(name, 1);
    const item = byName.get(name);
    if (item) for (const dep of [...item.registryDependencies].sort()) if (byName.has(dep)) visit(dep, [...path, name]);
    state.set(name, 2);
    order.push(name);
  };
  for (const name of [...byName.keys()].sort()) visit(name, []);
  return order;
}

/**
 * @param {{ strict?: boolean, write?: boolean, root?: string, coreElements?: string, tokensDist?: string, syncElementsFiles?: boolean }} [options]
 */
export function buildRegistry(options = {}) {
  const {
    strict = false,
    write = true,
    root = PKG_ROOT,
    coreElements = CORE_ELEMENTS,
    tokensDist = TOKENS_DIST,
    syncElementsFiles = true,
  } = options;
  const errors = [];
  const warnings = [];
  const warn = (msg) => (strict ? errors : warnings).push(msg);

  const pkg = readJson(join(root, 'package.json'));
  const version = pkg.version;
  const schema = readJson(join(root, 'registry.schema.json'));
  const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);

  // 1. Load and validate metadata.
  const itemsDir = join(root, 'items');
  const files = existsSync(itemsDir) ? readdirSync(itemsDir).filter((f) => f.endsWith('.json')).sort() : [];
  const metas = [];
  for (const f of files) {
    let meta;
    try {
      meta = readJson(join(itemsDir, f));
    } catch (e) {
      errors.push(`items/${f}: invalid JSON (${e.message})`);
      continue;
    }
    if (!validate(meta)) {
      for (const err of validate.errors) errors.push(`items/${f}: ${err.instancePath || '/'} ${err.message}`);
      continue;
    }
    if (meta.name + '.json' !== f) errors.push(`items/${f}: "name" must match the file name (${meta.name})`);
    metas.push(meta);
  }
  const names = new Set(metas.map((m) => m.name));

  // 2. Dependencies and cycles.
  for (const m of metas) {
    for (const dep of m.registryDependencies) {
      if (!names.has(dep)) errors.push(`${m.name}: unknown registry dependency "${dep}"`);
      if (dep === m.name) errors.push(`${m.name}: depends on itself`);
    }
  }
  const order = topoSort(metas, errors);

  // 3. Element bundles.
  const tags = [...new Set(metas.flatMap((m) => m.elements ?? []))];
  if (syncElementsFiles && tags.length > 0) {
    const { missing } = syncElements({ tags, coreElements, root });
    for (const t of missing) warn(`element bundle ${t} not found in packages/core/dist/elements (build core first)`);
  }

  // 4. Discover files, build entries.
  const read = (rel) => readFileSync(join(root, rel), 'utf8');
  const entries = new Map();
  const claimed = new Set();
  const generatedTokens = {};
  for (const m of metas) {
    const entry = { ...m, version, files: { angular: [], html: [] }, css: [] };
    const add = (list, rel, target, kind) => {
      claimed.add(rel);
      list.push({ target, kind, source: rel, content: undefined });
    };
    for (const fw of FRAMEWORKS) {
      const found = discover(root, fw, m.name, m.extraFiles?.[fw]);
      const src = relative(root, sourceDir(root, fw));
      for (const f of found) add(entry.files[fw], `${src}/${f}`, f, f === `${m.name}.tsx` || f === `${m.name}.ts` ? 'component' : 'support');
      for (const tag of m.elements ?? []) {
        for (const ext of ['js', 'd.ts']) {
          const rel = `${src}/elements/${tag}.${ext}`;
          if (existsSync(join(root, rel))) add(entry.files[fw], rel, `elements/${tag}.${ext}`, 'element');
        }
      }
    }
    for (const f of discover(root, 'html', m.name)) add(entry.files.html, `src/html/${f}`, f, 'recipe');

    if (m.name === 'tokens') {
      const css = join(tokensDist, 'deep-ink.css');
      const cssNoFonts = join(tokensDist, 'deep-ink.no-fonts.css');
      if (!existsSync(css) || !existsSync(cssNoFonts)) {
        errors.push('tokens: packages/tokens/dist is missing (run `pnpm --filter @microcks-deep-ink/tokens build`)');
      } else {
        generatedTokens.css = readFileSync(css, 'utf8');
        generatedTokens.cssNoFonts = readFileSync(cssNoFonts, 'utf8');
        entry.css.push({ target: 'tokens.css', kind: 'style', source: 'packages/tokens/dist/deep-ink.css', generated: true });
      }
    } else {
      for (const f of discover(root, 'css', m.name)) add(entry.css, `src/css/${f}`, f, 'style');
    }

    // Validation of the file set.
    if (m.cssOnly) {
      for (const fw of FRAMEWORKS) {
        if (entry.files[fw].length) errors.push(`${m.name}: cssOnly item must not have ${fw} files`);
      }
    } else {
      if (m.tier !== 'element' && entry.css.length === 0) errors.push(`${m.name}: missing CSS file src/css/${m.name}.css`);
      const missing = [];
      if (entry.files.angular.length === 0) missing.push('angular');
      if (entry.files.html.length === 0) missing.push('html');
      if (missing.length) warn(`${m.name}: no ${missing.join(', ')} files yet`);
      if ((m.elements ?? []).length) {
        for (const fw of FRAMEWORKS) {
          const have = entry.files[fw].filter((f) => f.kind === 'element').length;
          if (entry.files[fw].length && have === 0) warn(`${m.name}: no element bundle for ${fw}`);
        }
      }
    }
    entries.set(m.name, entry);
  }

  // Orphan sources (a file nobody claims) usually mean a typo in the name.
  for (const [dir, exts] of [['angular', EXT.angular], ['html', EXT.html], ['css', EXT.css]]) {
    const abs = sourceDir(root, dir);
    const src = relative(root, abs);
    if (!existsSync(abs)) continue;
    for (const d of readdirSync(abs, { withFileTypes: true })) {
      if (!d.isFile() || /\.(spec|stories)\./.test(d.name)) continue;
      if (!exts.some((e) => d.name.endsWith('.' + e))) continue;
      if (!claimed.has(`${src}/${d.name}`)) warn(`${src}/${d.name}: not owned by any item (name must start with an item name)`);
    }
  }

  if (errors.length) return { ok: false, errors, warnings };

  // 5. Contents (with copy headers) and outputs.
  const ordered = order.map((n) => entries.get(n));
  const full = { name: pkg.name, version, items: [], tokens: { css: generatedTokens.css ?? '', cssNoFonts: generatedTokens.cssNoFonts ?? '' } };
  const index = { name: pkg.name, version, items: [] };
  const sections = [];
  for (const e of ordered) {
    const rawOf = (f) => (f.generated ? (f.target === 'tokens.css' ? generatedTokens.css : '') : read(f.source));
    const withContent = (f) => ({ ...f, content: fileHeader(e.name, f.target, version) + rawOf(f) });
    const strip = (f) => ({ target: f.target, kind: f.kind });
    const hashed = [
      ...['angular', 'html'].flatMap((k) => e.files[k].map((f) => [`${k}:${f.target}`, rawOf(f)])),
      ...e.css.map((f) => [`css:${f.target}`, rawOf(f)]),
      ...(e.name === 'tokens' ? [['css:tokens.no-fonts.css', generatedTokens.cssNoFonts ?? '']] : []),
    ];
    const base = { ...e, hash: itemHash(hashed), files: undefined, css: undefined };
    const fullItem = { ...base, files: {}, css: e.css.map(withContent) };
    const indexItem = { ...base, files: {}, css: e.css.map(strip) };
    for (const k of ['angular', 'html']) {
      fullItem.files[k] = e.files[k].map(withContent);
      indexItem.files[k] = e.files[k].map(strip);
    }
    full.items.push(fullItem);
    index.items.push(indexItem);
  }
  index.items.sort((a, b) => a.name.localeCompare(b.name));
  full.items.sort((a, b) => a.name.localeCompare(b.name));

  // Concatenated CSS: base first, then every other item in dependency order. Tokens are loaded separately.
  const cssOrder = ['base', ...order.filter((n) => n !== 'base' && n !== 'tokens')].filter((n) => entries.has(n));
  for (const n of cssOrder) {
    for (const f of entries.get(n).css) sections.push(`/* ── ${n} ── */\n${read(f.source)}`);
  }
  const css = `/* Deep Ink components, concatenated for Storybook. Apps copy items with the CLI instead. Generated. */\n${sections.join('\n')}`;

  if (write) {
    const dist = join(root, 'dist');
    mkdirSync(dist, { recursive: true });
    writeFileSync(join(dist, 'registry.json'), JSON.stringify(index, null, 2) + '\n');
    writeFileSync(join(dist, 'registry.full.json'), JSON.stringify(full, null, 2) + '\n');
    writeFileSync(join(dist, 'deep-ink-components.css'), css);
  }
  return { ok: true, errors, warnings, index, full, css };
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const quiet = args.includes('--quiet');
  const result = buildRegistry({ strict });
  for (const w of result.warnings) if (!quiet) console.warn(`warning: ${w}`);
  if (!result.ok) {
    for (const e of result.errors) console.error(`error: ${e}`);
    console.error(`registry build failed (${result.errors.length} error${result.errors.length === 1 ? '' : 's'})`);
    process.exit(1);
  }
  console.log(`registry: ${result.index.items.length} items, ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'} -> dist/registry.json, registry.full.json, deep-ink-components.css`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
