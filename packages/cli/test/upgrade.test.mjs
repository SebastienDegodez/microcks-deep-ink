// Markup-only mode, base copies, status, split diff, --merge, index.css protection, orphans, old lockfiles.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(HERE, '..', 'bin', 'deep-ink.mjs');
const REGISTRY = resolve(HERE, '..', '..', 'registry', 'dist', 'registry.full.json');
const hasGit = spawnSync('git', ['--version']).status === 0;

const run = (args, opts = {}) =>
  spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', ...opts, env: { ...process.env, NO_COLOR: '1', ...opts.env } });

const temp = [];
const tmp = (prefix) => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temp.push(dir);
  return dir;
};
after(() => temp.forEach((d) => rmSync(d, { recursive: true, force: true })));

function project(pkg = { dependencies: { '@angular/core': '22' } }) {
  const dir = tmp('up-');
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
  return dir;
}
const read = (dir, rel) => readFileSync(join(dir, rel), 'utf8');
const write = (dir, rel, text) => {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), text);
};
const lockOf = (dir) => JSON.parse(read(dir, 'deep-ink.json'));
const walk = (dir, base = dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? (d.name === 'node_modules' ? [] : walk(join(dir, d.name), base)) : [join(dir, d.name).slice(base.length + 1)],
  );

/** A copy of the registry after `change(registry)`, as if the registry had moved on. */
function movedRegistry(change) {
  const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
  change(registry);
  const file = join(tmp('reg-'), 'registry.full.json');
  writeFileSync(file, JSON.stringify(registry));
  return file;
}
const itemOf = (registry, name) => registry.items.find((i) => i.name === name);
/** Replaces one line of a registry file (0-based index). */
const editLine = (file, index, text) => {
  const lines = file.content.split('\n');
  lines[index] = text;
  file.content = lines.join('\n');
};
const TABS = 'src/app/ui/tabs.ts';
const upstreamEdit = (index, text) => movedRegistry((r) => editLine(itemOf(r, 'tabs').files.angular.find((f) => f.target === 'tabs.ts'), index, text));
const localEdit = (dir, index, text) => {
  const lines = read(dir, TABS).split('\n');
  lines[index] = text;
  write(dir, TABS, lines.join('\n'));
};

describe('add --markup-only (plugins: the host owns the CSS)', () => {
  it('copies the HTML recipe and no CSS: no tokens, base, index.css or stylesheet', () => {
    const dir = project({ name: 'plugin' });
    const r = run(['add', 'button', '--framework', 'html', '--markup-only', '--cwd', dir]);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.ok(existsSync(join(dir, 'deep-ink/button.html')));
    assert.ok(existsSync(join(dir, 'deep-ink/icon.html')), 'registry dependencies still come along');
    const files = walk(dir).filter((f) => !f.startsWith('.deep-ink/'));
    assert.deepEqual(files.filter((f) => f.endsWith('.css')), []);
    assert.equal(existsSync(join(dir, 'deep-ink/css')), false);
    const lock = lockOf(dir);
    assert.equal(lock.markupOnly, true);
    assert.deepEqual(Object.keys(lock.items).sort(), ['button', 'icon']);
    assert.ok(!('tokens' in lock.items) && !('base' in lock.items));
    assert.doesNotMatch(files.map((f) => read(dir, f)).join('\n'), /:root|@layer deep-ink|fonts\.googleapis/);
  });

  it('copies element bundles of an element item, still without CSS', () => {
    const dir = project({ name: 'plugin' });
    assert.equal(run(['add', 'plugin-slot', '--framework', 'html', '--markup-only', '--cwd', dir]).status, 0);
    assert.ok(existsSync(join(dir, 'deep-ink/plugin-slot.html')));
    assert.ok(existsSync(join(dir, 'deep-ink/elements/plugin-slot.js')));
    assert.deepEqual(walk(dir).filter((f) => f.endsWith('.css')), []);
  });

  it('is remembered in deep-ink.json, so a later plain add stays CSS-free', () => {
    const dir = project({ name: 'plugin' });
    run(['add', 'button', '--framework', 'html', '--markup-only', '--cwd', dir]);
    assert.equal(run(['add', 'tabs', '--cwd', dir]).status, 0);
    assert.ok(existsSync(join(dir, 'deep-ink/tabs.html')));
    assert.deepEqual(walk(dir).filter((f) => f.endsWith('.css')), []);
  });

  it('works for the whole registry with --all and reports nothing odd', () => {
    const dir = project({ name: 'plugin' });
    const r = run(['add', '--all', '--framework', 'html', '--markup-only', '--cwd', dir]);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.deepEqual(walk(dir).filter((f) => f.endsWith('.css')), []);
  });

  it('--dry-run writes nothing', () => {
    const dir = project({ name: 'plugin' });
    const r = run(['add', 'button', '--framework', 'html', '--markup-only', '--dry-run', '--cwd', dir]);
    assert.match(r.stdout, /would add\s+deep-ink\/button\.html/);
    assert.equal(existsSync(join(dir, 'deep-ink')), false);
  });

  it('refuses a project that already copies CSS, and init', () => {
    const dir = project();
    run(['init', '--cwd', dir]);
    const r = run(['add', 'button', '--markup-only', '--cwd', dir]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /already records CSS files/);
    const i = run(['init', '--markup-only', '--cwd', project()]);
    assert.equal(i.status, 1);
    assert.match(i.stderr, /init copies only stylesheets/);
  });
});

describe('item versions and base copies', () => {
  it('records the content hash of every item and a base copy of every file', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
    const lock = lockOf(dir);
    assert.match(lock.items.tabs.hash, /^[0-9a-f]{16}$/);
    assert.equal(lock.items.tabs.hash, itemOf(registry, 'tabs').hash);
    assert.equal(lock.items.base.hash, itemOf(registry, 'base').hash);
    assert.notEqual(lock.items.tabs.hash, lock.items.base.hash);
    for (const item of Object.values(lock.items)) {
      for (const rel of Object.keys(item.files)) assert.equal(read(dir, `.deep-ink/base/${rel}`), read(dir, rel), rel);
    }
  });

  it('keeps the base when you edit the file, and moves it forward when you update', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const original = read(dir, TABS);
    write(dir, TABS, original + '\n// mine\n');
    run(['add', 'tabs', '--cwd', dir]);
    assert.equal(read(dir, `.deep-ink/base/${TABS}`), original);
    run(['add', 'tabs', '--overwrite', '--cwd', dir]);
    assert.equal(read(dir, TABS), original);
  });
});

describe('status', () => {
  it('reports up to date, locally modified, upstream changed and both (conflict), per file', () => {
    const dir = project();
    run(['add', 'tabs', 'button', 'chip', 'panel', '--cwd', dir]);
    const fresh = run(['status', '--cwd', dir]);
    assert.equal(fresh.status, 0);
    assert.match(fresh.stdout, /tabs\s+up to date/);
    assert.match(fresh.stdout, /all up to date/);

    write(dir, 'src/app/ui/button.ts', read(dir, 'src/app/ui/button.ts') + '\n// mine\n'); // local
    write(dir, 'src/app/ui/panel.ts', read(dir, 'src/app/ui/panel.ts') + '\n// mine\n'); // both
    const moved = movedRegistry((r) => {
      itemOf(r, 'tabs').files.angular[0].content += '\n// upstream\n';
      itemOf(r, 'panel').files.angular[0].content += '\n// upstream\n';
    });
    const s = run(['status', '--registry', moved, '--cwd', dir]);
    assert.equal(s.status, 0);
    assert.match(s.stdout, /^tabs\s+upstream changed/m);
    assert.match(s.stdout, /^button\s+locally modified/m);
    assert.match(s.stdout, /^panel\s+both \(conflict\)/m);
    assert.match(s.stdout, /^chip\s+up to date/m);
    assert.match(s.stdout, /^\s+upstream src\/app\/ui\/tabs\.ts/m);
    assert.match(s.stdout, /^\s+both\s+src\/app\/ui\/panel\.ts/m);
  });

  it('--exit-code exits 1 when something is not up to date, and --json lists the states', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    assert.equal(run(['status', '--exit-code', '--cwd', dir]).status, 0);
    const moved = upstreamEdit(60, '// upstream');
    assert.equal(run(['status', '--exit-code', '--registry', moved, '--cwd', dir]).status, 1);
    assert.equal(run(['status', '--registry', moved, '--cwd', dir]).status, 0);
    const rows = JSON.parse(run(['status', 'tabs', '--json', '--registry', moved, '--cwd', dir]).stdout);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'tabs');
    assert.equal(rows[0].state, 'upstream');
    assert.equal(rows[0].conflict, false);
  });

  it('a deleted file counts as a local change', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    rmSync(join(dir, TABS));
    const s = run(['status', 'tabs', '--cwd', dir]).stdout;
    assert.match(s, /tabs\s+locally modified/);
    assert.match(s, /\(deleted\)/);
  });

  it('needs a lockfile and known items', () => {
    assert.equal(run(['status', '--cwd', project()]).status, 1);
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    assert.equal(run(['status', 'nope', '--cwd', dir]).status, 1);
  });

  it('an old deep-ink.json without base copies still reports by hash, with a clear message', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    rmSync(join(dir, '.deep-ink'), { recursive: true });
    write(dir, TABS, read(dir, TABS) + '\n// mine\n');
    const s = run(['status', 'tabs', '--cwd', dir]);
    assert.match(s.stdout, /tabs\s+locally modified/);
    assert.match(s.stderr, /base unknown/);
  });
});

describe('diff', () => {
  it('shows local edits and upstream changes as two separate things', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    localEdit(dir, 5, '// LOCAL EDIT');
    const moved = upstreamEdit(120, '// UPSTREAM EDIT');
    const d = run(['diff', 'tabs', '--registry', moved, '--cwd', dir]).stdout;
    const [, local, upstream] = d.split(/^== .*$/m);
    assert.match(d, /== src\/app\/ui\/tabs\.ts: local edits \(base -> your file\)/);
    assert.match(d, /== src\/app\/ui\/tabs\.ts: upstream changes \(base -> registry\)/);
    assert.match(local, /^\+\/\/ LOCAL EDIT/m);
    assert.doesNotMatch(local, /UPSTREAM EDIT/);
    assert.match(upstream, /^\+\/\/ UPSTREAM EDIT/m);
    assert.doesNotMatch(upstream, /LOCAL EDIT/);
  });

  it('only shows upstream changes when you did not edit the file', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const d = run(['diff', 'tabs', '--registry', upstreamEdit(120, '// UPSTREAM EDIT'), '--cwd', dir]).stdout;
    assert.match(d, /upstream changes/);
    assert.doesNotMatch(d, /local edits/);
  });

  it('exits 0 by default and 1 with --exit-code when there are differences', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    assert.equal(run(['diff', 'tabs', '--exit-code', '--cwd', dir]).status, 0);
    write(dir, TABS, read(dir, TABS) + '\n// mine\n');
    assert.equal(run(['diff', 'tabs', '--cwd', dir]).status, 0);
    assert.equal(run(['diff', 'tabs', '--exit-code', '--cwd', dir]).status, 1);
    rmSync(join(dir, TABS));
    const gone = run(['diff', 'tabs', '--exit-code', '--cwd', dir]);
    assert.equal(gone.status, 1);
    assert.match(gone.stdout, /deleted locally/);
  });

  it('without a lockfile every file is "not copied yet" and --exit-code fails', () => {
    const r = run(['diff', 'tabs', '--exit-code', '--cwd', project()]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /not copied yet/);
  });

  it('with an old lockfile (no base copy) it says so and shows a single diff', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    rmSync(join(dir, '.deep-ink'), { recursive: true });
    write(dir, TABS, read(dir, TABS).replace('Tabs with the WAI-ARIA tabs pattern', 'Mine'));
    const r = run(['diff', 'tabs', '--cwd', dir]);
    assert.match(r.stdout, /base unknown, showing your file against the registry/);
    assert.match(r.stdout, /^--- local\//m);
    assert.match(r.stderr, /base unknown/);
  });
});

describe('add --merge', () => {
  const setup = () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    return dir;
  };

  it('is incompatible with --overwrite', () => {
    const r = run(['add', 'tabs', '--merge', '--overwrite', '--cwd', setup()]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /either --merge or --overwrite/);
  });

  it('without --merge, a file changed on both sides is still skipped (exit 2)', () => {
    const dir = setup();
    localEdit(dir, 5, '// LOCAL');
    const r = run(['add', 'tabs', '--registry', upstreamEdit(120, '// UPSTREAM'), '--cwd', dir]);
    assert.equal(r.status, 2);
    assert.match(read(dir, TABS), /\/\/ LOCAL/);
    assert.doesNotMatch(read(dir, TABS), /\/\/ UPSTREAM/);
  });

  it('merges edits that do not overlap (git merge-file) and moves the base forward', { skip: !hasGit && 'git not installed' }, () => {
    const dir = setup();
    localEdit(dir, 5, '// LOCAL');
    const r = run(['add', 'tabs', '--merge', '--registry', upstreamEdit(120, '// UPSTREAM'), '--cwd', dir]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /merged\s+src\/app\/ui\/tabs\.ts \(git\)/);
    const merged = read(dir, TABS);
    assert.match(merged, /^\/\/ LOCAL$/m);
    assert.match(merged, /^\/\/ UPSTREAM$/m);
    assert.doesNotMatch(merged, /<<<<<<<|>>>>>>>/);
    // The base is now the registry version, so what differs from it is exactly your edit.
    assert.match(read(dir, `.deep-ink/base/${TABS}`), /^\/\/ UPSTREAM$/m);
    assert.doesNotMatch(read(dir, `.deep-ink/base/${TABS}`), /\/\/ LOCAL/);
    const s = run(['status', 'tabs', '--registry', upstreamEdit(120, '// UPSTREAM'), '--cwd', dir]).stdout;
    assert.match(s, /tabs\s+locally modified/);
  });

  it('writes conflict markers when the same lines changed, and exits 2', { skip: !hasGit && 'git not installed' }, () => {
    const dir = setup();
    localEdit(dir, 120, '// LOCAL');
    const r = run(['add', 'tabs', '--merge', '--registry', upstreamEdit(120, '// UPSTREAM'), '--cwd', dir]);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /conflict\s+src\/app\/ui\/tabs\.ts \(1 conflict: resolve the <<<<<<< markers\)/);
    const text = read(dir, TABS);
    assert.match(text, /^<<<<<<< yours\n\/\/ LOCAL\n=======\n\/\/ UPSTREAM\n>>>>>>> registry$/m);
  });

  it('falls back to conflict markers when git is not available', () => {
    const dir = setup();
    localEdit(dir, 5, '// LOCAL');
    const empty = tmp('nopath-');
    const r = run(['add', 'tabs', '--merge', '--registry', upstreamEdit(120, '// UPSTREAM'), '--cwd', dir], { env: { PATH: empty } });
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stdout, /conflict\s+src\/app\/ui\/tabs\.ts/);
    const text = read(dir, TABS);
    assert.match(text, /^<<<<<<< yours$/m);
    assert.match(text, /^=======$/m);
    assert.match(text, /^>>>>>>> registry$/m);
    assert.match(text, /^\/\/ LOCAL$/m);
    assert.match(text, /^\/\/ UPSTREAM$/m);
  });

  it('keeps your file when only you changed it, without skipping', () => {
    const dir = setup();
    localEdit(dir, 5, '// LOCAL');
    const r = run(['add', 'tabs', '--merge', '--cwd', dir]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /kept\s+src\/app\/ui\/tabs\.ts/);
    assert.match(read(dir, TABS), /^\/\/ LOCAL$/m);
  });

  it('takes the registry version of a file you did not edit', () => {
    const dir = setup();
    const r = run(['add', 'tabs', '--merge', '--registry', upstreamEdit(120, '// UPSTREAM'), '--cwd', dir]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /updated\s+src\/app\/ui\/tabs\.ts/);
    assert.match(read(dir, TABS), /^\/\/ UPSTREAM$/m);
  });

  it('cannot merge without a base copy: skips with a clear message', () => {
    const dir = setup();
    rmSync(join(dir, '.deep-ink'), { recursive: true });
    localEdit(dir, 5, '// LOCAL');
    const r = run(['add', 'tabs', '--merge', '--registry', upstreamEdit(120, '// UPSTREAM'), '--cwd', dir]);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /no base copy to merge from/);
    assert.match(r.stderr, /base unknown/);
    assert.match(read(dir, TABS), /\/\/ LOCAL/);
  });

  it('--dry-run reports the merge and writes nothing', () => {
    const dir = setup();
    localEdit(dir, 5, '// LOCAL');
    const before = read(dir, TABS);
    const r = run(['add', 'tabs', '--merge', '--dry-run', '--registry', upstreamEdit(120, '// UPSTREAM'), '--cwd', dir]);
    assert.match(r.stdout, /would merge\s+src\/app\/ui\/tabs\.ts/);
    assert.equal(read(dir, TABS), before);
  });

  it('--overwrite keeps working and records the new base', () => {
    const dir = setup();
    localEdit(dir, 5, '// LOCAL');
    const moved = upstreamEdit(120, '// UPSTREAM');
    const r = run(['add', 'tabs', '--overwrite', '--registry', moved, '--cwd', dir]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /updated\s+src\/app\/ui\/tabs\.ts \(overwritten\)/);
    assert.doesNotMatch(read(dir, TABS), /\/\/ LOCAL/);
    assert.equal(read(dir, `.deep-ink/base/${TABS}`), read(dir, TABS));
  });
});

describe('old lockfiles (no base copies)', () => {
  it('add records base copies for files you did not edit, and tells you about the rest', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    rmSync(join(dir, '.deep-ink'), { recursive: true });
    const edited = read(dir, 'src/styles/deep-ink/tabs.css') + '\n/* mine */\n';
    write(dir, 'src/styles/deep-ink/tabs.css', edited);
    const r = run(['add', 'tabs', '--cwd', dir]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /base unknown/);
    assert.equal(existsSync(join(dir, `.deep-ink/base/${TABS}`)), true, 'unmodified file got its base');
    assert.equal(existsSync(join(dir, '.deep-ink/base/src/styles/deep-ink/tabs.css')), false, 'edited file has none');
    assert.equal(read(dir, 'src/styles/deep-ink/tabs.css'), edited);
  });
});

describe('index.css is hash-protected', () => {
  it('leaves an index.css you edited alone (exit 2) and --overwrite regenerates it', () => {
    const dir = project();
    run(['add', 'button', '--cwd', dir]);
    const index = 'src/styles/deep-ink/index.css';
    write(dir, index, read(dir, index) + '/* my own import */\n@import "./mine.css";\n');
    const r = run(['add', 'tabs', '--cwd', dir]);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /skip\s+src\/styles\/deep-ink\/index\.css \(modified locally/);
    assert.match(read(dir, index), /my own import/);
    assert.doesNotMatch(read(dir, index), /tabs\.css/);
    const o = run(['add', 'tabs', '--overwrite', '--cwd', dir]);
    assert.equal(o.status, 0);
    assert.match(read(dir, index), /tabs\.css/);
    assert.doesNotMatch(read(dir, index), /my own import/);
  });

  it('records its hash, and regenerates it silently when you did not touch it', () => {
    const dir = project();
    run(['add', 'button', '--cwd', dir]);
    const index = 'src/styles/deep-ink/index.css';
    assert.match(lockOf(dir).generated[index], /^[0-9a-f]{64}$/);
    assert.equal(run(['add', 'tabs', '--cwd', dir]).status, 0);
    assert.match(read(dir, index), /tabs\.css/);
  });

  it('accepts an untouched index.css written by an older deep-ink (no hash in the lockfile)', () => {
    const dir = project();
    run(['add', 'button', '--cwd', dir]);
    const lock = lockOf(dir);
    delete lock.generated;
    write(dir, 'deep-ink.json', JSON.stringify(lock));
    assert.equal(run(['add', 'tabs', '--cwd', dir]).status, 0);
    assert.match(read(dir, 'src/styles/deep-ink/index.css'), /tabs\.css/);
  });

  it('treats an old index.css with foreign content as edited', () => {
    const dir = project();
    run(['add', 'button', '--cwd', dir]);
    const lock = lockOf(dir);
    delete lock.generated;
    write(dir, 'deep-ink.json', JSON.stringify(lock));
    write(dir, 'src/styles/deep-ink/index.css', read(dir, 'src/styles/deep-ink/index.css') + 'body { margin: 0 }\n');
    assert.equal(run(['add', 'tabs', '--cwd', dir]).status, 2);
  });
});

describe('orphans', () => {
  // The registry moves on and tabs no longer ships its stylesheet.
  const withoutTabsCss = () => movedRegistry((r) => { itemOf(r, 'tabs').css = []; });
  const CSS = 'src/styles/deep-ink/tabs.css';

  it('reports the file, drops it from deep-ink.json and keeps it on disk', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const r = run(['add', 'tabs', '--registry', withoutTabsCss(), '--cwd', dir]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /orphan\s+src\/styles\/deep-ink\/tabs\.css \(no longer part of tabs; use --prune to delete\)/);
    assert.equal(existsSync(join(dir, CSS)), true);
    assert.equal(existsSync(join(dir, '.deep-ink/base', CSS)), false);
    assert.ok(!(CSS in lockOf(dir).items.tabs.files));
    assert.ok(TABS in lockOf(dir).items.tabs.files);
  });

  it('status and diff list an orphan before add drops it', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const moved = withoutTabsCss();
    assert.match(run(['status', '--registry', moved, '--cwd', dir]).stdout, /orphan\s+src\/styles\/deep-ink\/tabs\.css/);
    const d = run(['diff', 'tabs', '--exit-code', '--registry', moved, '--cwd', dir]);
    assert.equal(d.status, 1);
    assert.match(d.stdout, /tabs\.css: orphan/);
    assert.equal(run(['status', '--exit-code', '--registry', moved, '--cwd', dir]).status, 1);
  });

  it('--prune deletes an orphan you did not modify', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const r = run(['add', 'tabs', '--prune', '--registry', withoutTabsCss(), '--cwd', dir]);
    assert.match(r.stdout, /removed\s+src\/styles\/deep-ink\/tabs\.css/);
    assert.equal(existsSync(join(dir, CSS)), false);
    assert.ok(!(CSS in lockOf(dir).items.tabs.files));
  });

  it('--prune never deletes an orphan you modified', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    write(dir, CSS, read(dir, CSS) + '/* mine */\n');
    const r = run(['add', 'tabs', '--prune', '--registry', withoutTabsCss(), '--cwd', dir]);
    assert.match(r.stdout, /orphan\s+src\/styles\/deep-ink\/tabs\.css \(no longer part of tabs; modified locally, not deleted\)/);
    assert.match(read(dir, CSS), /mine/);
  });

  it('--dry-run changes nothing', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const before = read(dir, 'deep-ink.json');
    const r = run(['add', 'tabs', '--prune', '--dry-run', '--registry', withoutTabsCss(), '--cwd', dir]);
    assert.match(r.stdout, /would remove\s+src\/styles\/deep-ink\/tabs\.css/);
    assert.equal(existsSync(join(dir, CSS)), true);
    assert.equal(read(dir, 'deep-ink.json'), before);
  });
});

describe('help', () => {
  it('documents the new commands and flags', () => {
    const h = run(['--help']).stdout;
    for (const word of ['status', '--merge', '--prune', '--markup-only', '--exit-code', '.deep-ink/base']) assert.ok(h.includes(word), word);
  });
});
