import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertInside, planFile, relPath, writeFilePlan } from './copy.mjs';
import { DEFAULT_DIRS, FRAMEWORKS, detectFramework } from './detect.mjs';
import { unifiedDiff } from './diff.mjs';
import { LOCK_NAME, newLock, readLock, sha256, writeLock } from './lockfile.mjs';
import { log } from './log.mjs';
import { CliError, findItem, loadRegistry } from './registry.mjs';
import { filterByTier, frameworkFiles, resolveItems } from './resolve.mjs';

const TIERS = ['natural', 'microcks', 'element'];

function parseFramework(value) {
  if (value === undefined) return undefined;
  if (!FRAMEWORKS.includes(value)) throw new CliError(`Unknown framework "${value}". Use react, angular or html.`);
  return value;
}

function parseTiers(value) {
  if (value === undefined) return undefined;
  const tiers = value.split(',').map((t) => t.trim()).filter(Boolean);
  for (const t of tiers) if (!TIERS.includes(t)) throw new CliError(`Unknown tier "${t}". Use ${TIERS.join(', ')}.`);
  return tiers;
}

/** Flags beat the lockfile, which beats detection. */
function resolveConfig(cwd, values, lock) {
  const framework = parseFramework(values.framework) ?? lock?.framework ?? detectFramework(cwd);
  const defaults = DEFAULT_DIRS[framework];
  const sameFramework = !lock || lock.framework === framework;
  const out = values.out ?? (sameFramework ? lock?.out : undefined) ?? defaults.out;
  const cssOut = values['css-out'] ?? (sameFramework ? lock?.cssOut : undefined) ?? defaults.cssOut;
  for (const dir of [out, cssOut]) {
    if (!assertInside(cwd, dir)) throw new CliError(`Output folder "${dir}" is outside the target project.`);
  }
  return { framework, out, cssOut, noFonts: Boolean(values['no-fonts'] || lock?.noFonts) };
}

function targetCwd(values) {
  const cwd = resolve(values.cwd ?? process.cwd());
  if (!existsSync(cwd)) throw new CliError(`Folder not found: ${cwd}`);
  return cwd;
}

/** Content to write for a registry file. Tokens honour --no-fonts and keep the copy header. */
function contentFor(registry, item, file, noFonts) {
  if (item.name === 'tokens' && file.target === 'tokens.css' && noFonts) {
    const header = file.content.slice(0, file.content.indexOf('\n') + 1);
    return header + registry.tokens.cssNoFonts;
  }
  return file.content;
}

function filesOf(registry, item, cfg) {
  const code = frameworkFiles(item, cfg.framework).map((f) => ({
    rel: join(cfg.out, f.target),
    content: contentFor(registry, item, f, cfg.noFonts),
  }));
  const css = item.css.map((f) => ({ rel: join(cfg.cssOut, f.target), content: contentFor(registry, item, f, cfg.noFonts) }));
  return [...code, ...css];
}

function writeIndexCss(cwd, registry, lock, cfg) {
  const names = Object.keys(lock.items).filter((n) => registry.items.some((i) => i.name === n));
  const ordered = resolveItems(registry, names).filter((i) => names.includes(i.name));
  const lines = ['/* Deep Ink · imports in dependency order. Rewritten by `deep-ink add`. */'];
  for (const item of ordered) for (const f of item.css) lines.push(`@import './${f.target}';`);
  const abs = join(cwd, cfg.cssOut, 'index.css');
  mkdirSync(join(cwd, cfg.cssOut), { recursive: true });
  writeFileSync(abs, lines.join('\n') + '\n');
}

/** Copies items (and dependencies) and updates the lockfile. Returns the exit code. */
function install({ cwd, registry, names, cfg, lock, overwrite, dryRun }) {
  const items = resolveItems(registry, names);
  const next = lock ?? newLock({ framework: cfg.framework, out: cfg.out, cssOut: cfg.cssOut, registryVersion: registry.version, noFonts: cfg.noFonts });
  Object.assign(next, { framework: cfg.framework, out: cfg.out, cssOut: cfg.cssOut, registryVersion: registry.version });
  if (cfg.noFonts) next.noFonts = true;

  let skipped = 0;
  let changed = 0;
  const npm = new Set();

  for (const item of items) {
    const entry = next.items[item.name] ?? { version: registry.version, files: {} };
    const hasFramework = cfg.framework === 'html' ? item.files.html.length > 0 : item.files[cfg.framework]?.length > 0;
    if (!hasFramework && !item.cssOnly && item.tier !== 'element') {
      log.warn(`${item.name}: no ${cfg.framework} files in the registry yet, copying CSS only`);
    }
    for (const file of filesOf(registry, item, cfg)) {
      const rel = relPath(cwd, join(cwd, file.rel));
      const plan = planFile({ cwd, rel, content: file.content, lockedHash: entry.files[rel], overwrite });
      if (plan.action === 'same') {
        entry.files[rel] = sha256(plan.content);
        continue;
      }
      if (plan.action === 'skipped') {
        skipped++;
        log.skip(rel, `modified locally, use --overwrite or deep-ink diff ${item.name}`);
        continue;
      }
      changed++;
      if (dryRun) log.would(plan.action === 'added' ? 'add' : 'update', rel);
      else {
        writeFilePlan(plan);
        if (plan.action === 'added') log.added(rel);
        else log.updated(rel, plan.overwritten ? ' (overwritten)' : '');
        entry.files[rel] = sha256(plan.content);
      }
    }
    entry.version = registry.version;
    next.items[item.name] = entry;
    for (const dep of item.npmDependencies?.[cfg.framework] ?? []) npm.add(dep);
  }

  if (!dryRun) {
    writeIndexCss(cwd, registry, next, cfg);
    writeLock(cwd, next);
  }
  if (changed === 0 && skipped === 0) log.info(dryRun ? 'Nothing to do: up to date.' : 'up to date');
  if (npm.size > 0 && !dryRun) log.info(`\nInstall these packages if missing: ${[...npm].join(' ')}`);
  return skipped > 0 ? 2 : 0;
}

export function init({ values }) {
  const cwd = targetCwd(values);
  const registry = loadRegistry(values.registry);
  const lock = readLock(cwd);
  const cfg = resolveConfig(cwd, values, lock);
  const code = install({ cwd, registry, names: ['tokens', 'base'], cfg, lock, overwrite: Boolean(values.overwrite), dryRun: Boolean(values['dry-run']) });
  if (!values['dry-run']) {
    log.line('');
    log.line(`Deep Ink initialised for ${cfg.framework} in ${cwd}`);
    log.line(`  components  ${cfg.out}`);
    log.line(`  styles      ${cfg.cssOut}`);
    log.line('Next steps:');
    if (cfg.framework === 'angular') log.line(`  1. Add "${cfg.cssOut}/index.css" to the "styles" array of angular.json`);
    else if (cfg.framework === 'react') log.line(`  1. Import "${cfg.cssOut}/index.css" once, in your entry file`);
    else log.line(`  1. Link "${cfg.cssOut}/index.css" (or tokens.css and base.css) in your <head>`);
    log.line('  2. Put lang on <html> and a skip link as the first element: <a class="di-skip-link" href="#main">');
    log.line('  3. Run `deep-ink add button tabs` to copy components');
  }
  return code;
}

export function add({ values, positionals }) {
  const cwd = targetCwd(values);
  const registry = loadRegistry(values.registry);
  const tiers = parseTiers(values.tier);
  let names = positionals;
  if (values.all) names = filterByTier(registry, tiers);
  else if (tiers) throw new CliError('--tier only works together with --all.');
  if (names.length === 0) throw new CliError('Name at least one item, or use --all. Try `deep-ink list`.');
  for (const n of names) findItem(registry, n);
  const lock = readLock(cwd);
  const cfg = resolveConfig(cwd, values, lock);
  return install({ cwd, registry, names, cfg, lock, overwrite: Boolean(values.overwrite), dryRun: Boolean(values['dry-run']) });
}

export function list({ values }) {
  const registry = loadRegistry(values.registry);
  const framework = parseFramework(values.framework);
  const tiers = parseTiers(values.tier);
  const rows = registry.items
    .filter((i) => !tiers || tiers.includes(i.tier))
    .filter((i) => !framework || i.cssOnly || frameworkFiles(i, framework).length > 0)
    .map((i) => ({
      name: i.name,
      tier: i.tier,
      description: i.description,
      dependencies: i.registryDependencies,
      frameworks: FRAMEWORKS.filter((f) => i.cssOnly || frameworkFiles(i, f).length > 0),
    }));
  if (values.json) {
    log.line(JSON.stringify(rows, null, 2));
    return 0;
  }
  const width = Math.max(4, ...rows.map((r) => r.name.length));
  log.line(`${'NAME'.padEnd(width)}  ${'TIER'.padEnd(8)}  DESCRIPTION`);
  for (const r of rows) log.line(`${r.name.padEnd(width)}  ${r.tier.padEnd(8)}  ${r.description}`);
  log.line(`\n${rows.length} item${rows.length === 1 ? '' : 's'}`);
  return 0;
}

export function view({ values, positionals }) {
  if (positionals.length !== 1) throw new CliError('Usage: deep-ink view <item> [--framework react|angular|html]');
  const cwd = targetCwd(values);
  const registry = loadRegistry(values.registry);
  const item = findItem(registry, positionals[0]);
  const cfg = resolveConfig(cwd, values, readLock(cwd));
  const files = filesOf(registry, item, cfg);
  if (files.length === 0) throw new CliError(`${item.name} has no ${cfg.framework} files.`);
  for (const f of files) {
    log.line(`=== ${f.rel} ===`);
    log.line(f.content.replace(/\n$/, ''));
    log.line('');
  }
  return 0;
}

export function diff({ values, positionals }) {
  if (positionals.length !== 1) throw new CliError('Usage: deep-ink diff <item> [--cwd DIR]');
  const cwd = targetCwd(values);
  const registry = loadRegistry(values.registry);
  const item = findItem(registry, positionals[0]);
  const cfg = resolveConfig(cwd, values, readLock(cwd));
  let differing = 0;
  for (const f of filesOf(registry, item, cfg)) {
    const abs = join(cwd, f.rel);
    if (!existsSync(abs)) {
      log.line(`${f.rel}: not copied yet`);
      differing++;
      continue;
    }
    const d = unifiedDiff(readFileSync(abs, 'utf8'), f.content, `local/${f.rel}`, `registry/${f.rel}`);
    if (d) {
      differing++;
      log.line(d);
    }
  }
  if (differing === 0) log.line(`${item.name}: identical to the registry`);
  return 0;
}

export { LOCK_NAME };
