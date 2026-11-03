import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertInside, planFile, relPath, writeFilePlan } from './copy.mjs';
import { DEFAULT_DIRS, FRAMEWORKS, detectFramework } from './detect.mjs';
import { unifiedDiff } from './diff.mjs';
import { BASE_DIR, LOCK_NAME, newLock, readBase, readLock, removeBase, sha256, writeBase, writeLock } from './lockfile.mjs';
import { log } from './log.mjs';
import { CliError, findItem, loadRegistry } from './registry.mjs';
import { filterByTier, frameworkFiles, resolveItems } from './resolve.mjs';
import { BASE_UNKNOWN_HINT, inspectFile } from './state.mjs';

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
  if (values['markup-only'] && lock && !lock.markupOnly && Object.keys(lock.items).length > 0) {
    throw new CliError(`${LOCK_NAME} already records CSS files. --markup-only is for projects, such as plugins, that never copy CSS: use another folder.`);
  }
  return {
    framework,
    out,
    cssOut,
    noFonts: Boolean(values['no-fonts'] || lock?.noFonts),
    // The host owns all design-system CSS: a markup-only project (a plugin) copies no stylesheet at all.
    markupOnly: Boolean(values['markup-only'] || lock?.markupOnly),
  };
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
  if (cfg.markupOnly) return code;
  const css = item.css.map((f) => ({ rel: join(cfg.cssOut, f.target), content: contentFor(registry, item, f, cfg.noFonts) }));
  return [...code, ...css];
}

const looksGenerated = (text) => {
  const lines = text.split('\n').filter(Boolean);
  return lines[0]?.startsWith('/* Deep Ink · imports in dependency order') && lines.slice(1).every((l) => /^@import '\.\/[^']+';$/.test(l));
};

/**
 * Writes index.css. It is generated, but hash-protected like any copied file: if you edited it, it is left alone
 * (use --overwrite). Returns true when it was left alone.
 */
function writeIndexCss(cwd, registry, lock, cfg, { overwrite, dryRun }) {
  const names = Object.keys(lock.items).filter((n) => registry.items.some((i) => i.name === n));
  const ordered = resolveItems(registry, names).filter((i) => names.includes(i.name));
  const lines = ['/* Deep Ink · imports in dependency order. Rewritten by `deep-ink add`. */'];
  for (const item of ordered) for (const f of item.css) lines.push(`@import './${f.target}';`);
  const content = lines.join('\n') + '\n';
  const rel = relPath(cwd, join(cwd, cfg.cssOut, 'index.css'));
  const abs = join(cwd, rel);
  lock.generated ??= {};
  if (existsSync(abs)) {
    const current = readFileSync(abs, 'utf8');
    if (current === content) {
      lock.generated[rel] = sha256(content);
      return false;
    }
    const recorded = lock.generated[rel];
    // Older lockfiles did not record index.css: accept it when it still looks exactly like a generated one.
    const untouched = recorded ? sha256(current) === recorded : looksGenerated(current);
    if (!untouched && !overwrite) {
      log.skip(rel, 'modified locally, it is generated from deep-ink.json: use --overwrite');
      return true;
    }
  }
  if (dryRun) {
    log.would(existsSync(abs) ? 'update' : 'add', rel);
    return false;
  }
  mkdirSync(join(cwd, cfg.cssOut), { recursive: true });
  writeFileSync(abs, content);
  lock.generated[rel] = sha256(content);
  return false;
}

/** Records `content` as both the lock hash and the base copy of a file that now equals the registry. */
function record(cwd, entry, rel, content) {
  entry.files[rel] = sha256(content);
  writeBase(cwd, rel, content);
}

/** Files recorded in the lock for an item that the item no longer ships. Never touches user files without prune. */
function handleOrphans({ cwd, item, entry, current, prune, dryRun }) {
  for (const rel of Object.keys(entry.files)) {
    if (current.has(rel)) continue;
    const abs = join(cwd, rel);
    const unmodified = existsSync(abs) && sha256(readFileSync(abs, 'utf8')) === entry.files[rel];
    if (prune && unmodified) {
      if (dryRun) {
        log.would('remove', rel);
        continue;
      }
      rmSync(abs, { force: true });
      log.removed(rel, ` (no longer part of ${item.name})`);
    } else if (existsSync(abs)) {
      const why = prune ? 'modified locally, not deleted' : 'use --prune to delete';
      log.orphan(rel, `no longer part of ${item.name}; ${why}`);
    } else {
      log.orphan(rel, `no longer part of ${item.name}; already gone`);
    }
    if (!dryRun) {
      delete entry.files[rel];
      removeBase(cwd, rel);
    }
  }
}

/** Copies items (and dependencies) and updates the lockfile. Returns the exit code. */
function install({ cwd, registry, names, cfg, lock, overwrite, merge, prune, dryRun }) {
  const items = resolveItems(registry, names);
  const next = lock ?? newLock({ framework: cfg.framework, out: cfg.out, cssOut: cfg.cssOut, registryVersion: registry.version, noFonts: cfg.noFonts, markupOnly: cfg.markupOnly });
  Object.assign(next, { framework: cfg.framework, out: cfg.out, cssOut: cfg.cssOut, registryVersion: registry.version });
  if (cfg.noFonts) next.noFonts = true;
  if (cfg.markupOnly) next.markupOnly = true;

  let skipped = 0;
  let changed = 0;
  let unknownBase = 0;
  const npm = new Set();

  for (const item of items) {
    const files = filesOf(registry, item, cfg);
    // Stylesheet-only items (tokens, base) are the host's page foundation: their recipes document the host page.
    if (cfg.markupOnly && (item.cssOnly || files.length === 0)) continue;
    const entry = next.items[item.name] ?? { version: registry.version, files: {} };
    const hasFramework = cfg.framework === 'html' ? item.files.html.length > 0 : item.files[cfg.framework]?.length > 0;
    if (!hasFramework && !item.cssOnly && item.tier !== 'element') {
      log.warn(`${item.name}: no ${cfg.framework} files in the registry yet${cfg.markupOnly ? '' : ', copying CSS only'}`);
    }
    for (const file of files) {
      const rel = relPath(cwd, join(cwd, file.rel));
      const base = readBase(cwd, rel);
      const lockedHash = entry.files[rel];
      const plan = planFile({ cwd, rel, content: file.content, lockedHash, base, overwrite, merge });
      if (plan.action === 'same') {
        if (!dryRun) record(cwd, entry, rel, plan.content);
        continue;
      }
      if (plan.action === 'kept') {
        log.kept(rel, 'your edits, the registry did not change');
        continue;
      }
      if (plan.action === 'skipped') {
        skipped++;
        if (plan.reason === 'base-unknown') {
          unknownBase++;
          log.skip(rel, `modified locally and no base copy to merge from, use --overwrite or deep-ink diff ${item.name}`);
        } else {
          if (lockedHash && base === undefined) unknownBase++;
          log.skip(rel, `modified locally, use --merge, --overwrite or deep-ink diff ${item.name}`);
        }
        continue;
      }
      changed++;
      if (plan.action === 'merged' || plan.action === 'conflict') {
        const conflict = plan.action === 'conflict';
        if (conflict) skipped++;
        if (dryRun) log.would(conflict ? 'merge (with conflicts)' : 'merge', rel);
        else {
          writeFilePlan(plan);
          const note = conflict ? ` (${plan.conflicts} conflict${plan.conflicts === 1 ? '' : 's'}: resolve the <<<<<<< markers)` : ` (${plan.tool})`;
          (conflict ? log.conflict : log.merged)(rel, note);
          // The registry version is the new base: what differs from it afterwards is your edit.
          record(cwd, entry, rel, plan.upstream);
        }
        continue;
      }
      if (dryRun) log.would(plan.action === 'added' ? 'add' : 'update', rel);
      else {
        writeFilePlan(plan);
        if (plan.action === 'added') log.added(rel);
        else log.updated(rel, plan.overwritten ? ' (overwritten)' : '');
        record(cwd, entry, rel, plan.content);
      }
    }
    handleOrphans({ cwd, item, entry, current: new Set(files.map((f) => relPath(cwd, join(cwd, f.rel)))), prune, dryRun });
    entry.version = registry.version;
    if (item.hash) entry.hash = item.hash;
    next.items[item.name] = entry;
    for (const dep of item.npmDependencies?.[cfg.framework] ?? []) npm.add(dep);
  }

  if (!cfg.markupOnly && writeIndexCss(cwd, registry, next, cfg, { overwrite, dryRun })) skipped++;
  if (!dryRun) writeLock(cwd, next);
  if (changed === 0 && skipped === 0) log.info(dryRun ? 'Nothing to do: up to date.' : 'up to date');
  if (unknownBase > 0) log.warn(`${unknownBase} file${unknownBase === 1 ? '' : 's'}: ${BASE_UNKNOWN_HINT}`);
  if (npm.size > 0 && !dryRun) log.info(`\nInstall these packages if missing: ${[...npm].join(' ')}`);
  return skipped > 0 ? 2 : 0;
}

function installFlags(values) {
  if (values.merge && values.overwrite) throw new CliError('Use either --merge or --overwrite, not both.');
  return { overwrite: Boolean(values.overwrite), merge: Boolean(values.merge), prune: Boolean(values.prune), dryRun: Boolean(values['dry-run']) };
}

export function init({ values }) {
  const cwd = targetCwd(values);
  if (values['markup-only']) throw new CliError('init copies only stylesheets (tokens and base). --markup-only is for `add`.');
  const registry = loadRegistry(values.registry);
  const lock = readLock(cwd);
  const cfg = resolveConfig(cwd, values, lock);
  const code = install({ cwd, registry, names: ['tokens', 'base'], cfg, lock, ...installFlags(values) });
  if (!values['dry-run']) {
    log.line('');
    log.line(`Deep Ink initialised for ${cfg.framework} in ${cwd}`);
    log.line(`  components  ${cfg.out}`);
    log.line(`  styles      ${cfg.cssOut}`);
    log.line('Next steps:');
    if (cfg.framework === 'angular') log.line(`  1. Add "${cfg.cssOut}/index.css" to the "styles" array of angular.json`);
    else if (cfg.framework === 'react') log.line(`  1. Import "${cfg.cssOut}/index.css" once, in your entry file`);
    else log.line(`  1. Link "${cfg.cssOut}/index.css" (or tokens.css and base.css) in your <head>`);
    log.line('  2. Put lang on <html> and a skip link as the first element: <a class="skip-link" href="#main">');
    log.line('  3. Run `deep-ink add button tabs` to copy components');
    log.line(`  4. Commit ${LOCK_NAME} and ${BASE_DIR}/: they are what makes upgrades and merges possible`);
  }
  return code;
}

export function add({ values, positionals }) {
  const cwd = targetCwd(values);
  const registry = loadRegistry(values.registry);
  const tiers = parseTiers(values.tier);
  let names = positionals;
  if (values.all && positionals.length > 0) throw new CliError('Use either item names or --all, not both.');
  if (values.all) names = filterByTier(registry, tiers);
  else if (tiers) throw new CliError('--tier only works together with --all.');
  if (names.length === 0) throw new CliError('Name at least one item, or use --all. Try `deep-ink list`.');
  for (const n of names) findItem(registry, n);
  const lock = readLock(cwd);
  const cfg = resolveConfig(cwd, values, lock);
  return install({ cwd, registry, names, cfg, lock, ...installFlags(values) });
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

/** Items of the lock that match the (optional) names, with their files as the current registry ships them. */
function lockedItems({ cwd, registry, lock, cfg, names }) {
  return Object.keys(lock.items)
    .filter((n) => names.length === 0 || names.includes(n))
    .map((name) => {
      const item = registry.items.find((i) => i.name === name);
      const entry = lock.items[name];
      const files = item ? filesOf(registry, item, cfg) : [];
      const current = new Set(files.map((f) => relPath(cwd, join(cwd, f.rel))));
      const orphans = Object.keys(entry.files ?? {}).filter((rel) => !current.has(rel));
      return { name, item, entry, files, orphans };
    });
}

export function diff({ values, positionals }) {
  if (positionals.length !== 1) throw new CliError('Usage: deep-ink diff <item> [--exit-code] [--cwd DIR]');
  const cwd = targetCwd(values);
  const registry = loadRegistry(values.registry);
  const item = findItem(registry, positionals[0]);
  const lock = readLock(cwd);
  const cfg = resolveConfig(cwd, values, lock);
  const entry = lock?.items?.[item.name];
  let differing = 0;
  let unknownBase = 0;
  for (const f of filesOf(registry, item, cfg)) {
    const rel = relPath(cwd, join(cwd, f.rel));
    const s = inspectFile({ cwd, rel, upstream: f.content, lockedHash: entry?.files?.[rel] });
    if (s.state === 'ok') continue;
    differing++;
    if (s.state === 'missing') {
      log.line(`${rel}: ${s.tracked ? 'deleted locally' : 'not copied yet'}`);
      continue;
    }
    if (!s.hasBase) {
      // Without a base the two sides cannot be told apart: show one diff, as older versions did.
      unknownBase++;
      log.line(`${rel}: base unknown, showing your file against the registry`);
      log.line(unifiedDiff(s.working, s.upstream, `local/${rel}`, `registry/${rel}`));
      continue;
    }
    if (s.working !== s.base) {
      log.line(`== ${rel}: local edits (base -> your file)`);
      log.line(unifiedDiff(s.base, s.working, `base/${rel}`, `local/${rel}`));
    }
    if (s.upstream !== s.base) {
      log.line(`== ${rel}: upstream changes (base -> registry)`);
      log.line(unifiedDiff(s.base, s.upstream, `base/${rel}`, `registry/${rel}`));
    }
  }
  for (const rel of Object.keys(entry?.files ?? {})) {
    if (filesOf(registry, item, cfg).some((f) => relPath(cwd, join(cwd, f.rel)) === rel)) continue;
    differing++;
    log.line(`${rel}: orphan, no longer part of ${item.name}`);
  }
  if (unknownBase > 0) log.warn(BASE_UNKNOWN_HINT);
  if (differing === 0) log.line(`${item.name}: identical to the registry`);
  return values['exit-code'] && differing > 0 ? 1 : 0;
}

const STATUS_LABEL = {
  ok: 'up to date',
  upstream: 'upstream changed',
  local: 'locally modified',
  both: 'both (conflict)',
  'both-files': 'upstream changed, locally modified (different files)',
  removed: 'removed from the registry',
};

/** Reports, for each item of deep-ink.json: up to date, upstream changed, locally modified, or both (conflict). */
export function status({ values, positionals }) {
  const cwd = targetCwd(values);
  const registry = loadRegistry(values.registry);
  const lock = readLock(cwd);
  if (!lock) throw new CliError(`No ${LOCK_NAME} in ${cwd}. Run \`deep-ink init\` or \`deep-ink add\` first.`);
  for (const n of positionals) if (!lock.items[n]) throw new CliError(`"${n}" is not in ${LOCK_NAME}.`);
  const cfg = resolveConfig(cwd, values, lock);
  const rows = [];
  let unknownBase = 0;
  for (const { name, item, entry, files, orphans } of lockedItems({ cwd, registry, lock, cfg, names: positionals })) {
    const states = files.map((f) => {
      const rel = relPath(cwd, join(cwd, f.rel));
      const s = inspectFile({ cwd, rel, upstream: f.content, lockedHash: entry.files?.[rel] });
      if (!s.hasBase && s.tracked) unknownBase++;
      return { rel, state: s.state === 'missing' ? 'local' : s.state, detail: s.state === 'missing' ? 'deleted' : undefined, hasBase: s.hasBase };
    });
    const has = (st) => states.some((x) => x.state === st);
    let state;
    if (!item) state = 'removed';
    else if (has('both')) state = 'both';
    else if (has('upstream') && has('local')) state = 'both-files';
    else if (has('upstream')) state = 'upstream';
    else if (has('local')) state = 'local';
    else state = 'ok';
    rows.push({ name, state: state === 'both-files' ? 'both' : state, conflict: state === 'both', label: STATUS_LABEL[state], files: states.filter((x) => x.state !== 'ok'), orphans });
  }
  if (values.json) {
    log.line(JSON.stringify(rows, null, 2));
  } else {
    const width = Math.max(4, ...rows.map((r) => r.name.length));
    for (const r of rows) {
      log.line(`${r.name.padEnd(width)}  ${r.label}`);
      for (const f of r.files) log.line(`  ${f.state.padEnd(8)} ${f.rel}${f.detail ? ` (${f.detail})` : ''}`);
      for (const o of r.orphans) log.line(`  orphan   ${o} (no longer part of ${r.name})`);
    }
    const stale = rows.filter((r) => r.state !== 'ok' || r.orphans.length > 0).length;
    log.line(`\n${rows.length} item${rows.length === 1 ? '' : 's'}, ${stale === 0 ? 'all up to date' : `${stale} to look at`}`);
    if (unknownBase > 0) log.warn(`${unknownBase} file${unknownBase === 1 ? '' : 's'}: ${BASE_UNKNOWN_HINT}`);
  }
  const dirty = rows.some((r) => r.state !== 'ok' || r.orphans.length > 0);
  return values['exit-code'] && dirty ? 1 : 0;
}

export { LOCK_NAME };
