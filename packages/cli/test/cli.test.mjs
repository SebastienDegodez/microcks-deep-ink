import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(HERE, '..', 'bin', 'deep-ink.mjs');
const REGISTRY = resolve(HERE, '..', '..', 'registry', 'dist', 'registry.full.json');

const run = (args, opts = {}) =>
  spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' }, ...opts });

const temp = [];
function project(pkg = { dependencies: { react: '19' } }) {
  const dir = mkdtempSync(join(tmpdir(), 'cli-'));
  temp.push(dir);
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg));
  return dir;
}
const read = (dir, rel) => readFileSync(join(dir, rel), 'utf8');

before(() => {
  assert.ok(existsSync(REGISTRY), 'build the registry first: pnpm --filter @microcks-deep-ink/registry build');
});
after(() => {
  for (const d of temp) rmSync(d, { recursive: true, force: true });
});

describe('list', () => {
  it('prints items and supports --json and --tier', () => {
    const r = run(['list']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /button\s+natural/);
    const json = JSON.parse(run(['list', '--json', '--tier', 'natural']).stdout);
    assert.ok(json.every((i) => i.tier === 'natural'));
    assert.ok(json.some((i) => i.name === 'tabs'));
  });
});

describe('init', () => {
  it('copies tokens and base, writes index.css and the lockfile', () => {
    const dir = project();
    const r = run(['init', '--cwd', dir]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(dir, 'src/styles/deep-ink/tokens.css')));
    assert.ok(existsSync(join(dir, 'src/styles/deep-ink/base.css')));
    const index = read(dir, 'src/styles/deep-ink/index.css');
    assert.ok(index.indexOf("./tokens.css") < index.indexOf('./base.css'));
    const lock = JSON.parse(read(dir, 'deep-ink.json'));
    assert.equal(lock.framework, 'react');
    assert.equal(lock.out, 'src/components/ui');
    assert.equal(lock.items.base.files['src/styles/deep-ink/base.css'].length, 64);
    assert.match(read(dir, 'src/styles/deep-ink/base.css'), /^\/\* Deep Ink · base@0\.2\.0 · copied from packages\/registry\. You own this file\. \*\//);
  });

  it('--no-fonts copies the token variant without the font import', () => {
    const dir = project();
    assert.equal(run(['init', '--cwd', dir, '--no-fonts']).status, 0);
    assert.doesNotMatch(read(dir, 'src/styles/deep-ink/tokens.css'), /fonts\.googleapis/);
  });

  it('honors --out and --css-out', () => {
    const dir = project();
    assert.equal(run(['init', '--cwd', dir, '--out', 'src/ui', '--css-out', 'src/css']).status, 0);
    assert.ok(existsSync(join(dir, 'src/css/tokens.css')));
    assert.equal(JSON.parse(read(dir, 'deep-ink.json')).out, 'src/ui');
  });
});

describe('add', () => {
  it('copies an item with its registry dependencies', () => {
    const dir = project();
    run(['init', '--cwd', dir]);
    const r = run(['add', 'tabs', '--cwd', dir]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(dir, 'src/components/ui/tabs.tsx')));
    assert.ok(existsSync(join(dir, 'src/styles/deep-ink/tabs.css')));
    assert.match(read(dir, 'src/styles/deep-ink/index.css'), /tabs\.css/);
    assert.match(read(dir, 'src/components/ui/tabs.tsx'), /^\/\/ Deep Ink · tabs@0\.2\.0 · copied from packages\/registry\. You own this file\./);
    // Transitive dependencies: button needs icon.
    run(['add', 'button', '--cwd', dir]);
    assert.ok(existsSync(join(dir, 'src/components/ui/icon.tsx')));
    assert.ok(existsSync(join(dir, 'src/styles/deep-ink/icon.css')));
    assert.ok(JSON.parse(read(dir, 'deep-ink.json')).items.icon);
  });

  it('works without init and orders imports by dependency', () => {
    const dir = project();
    assert.equal(run(['add', 'button', '--cwd', dir]).status, 0);
    const index = read(dir, 'src/styles/deep-ink/index.css');
    const at = (n) => index.indexOf(`./${n}.css`);
    assert.ok(at('tokens') < at('base') && at('base') < at('icon') && at('icon') < at('button'));
  });

  it('skips identical files: second run is up to date with exit 0', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const r = run(['add', 'tabs', '--cwd', dir]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /up to date/);
  });

  it('skips locally modified files with exit 2, and --overwrite replaces them', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    const file = join(dir, 'src/components/ui/tabs.tsx');
    writeFileSync(file, read(dir, 'src/components/ui/tabs.tsx') + '\n// my edit\n');
    const r = run(['add', 'tabs', '--cwd', dir]);
    assert.equal(r.status, 2);
    assert.match(r.stdout, /skip\s+src\/components\/ui\/tabs\.tsx \(modified locally, use --merge, --overwrite or deep-ink diff tabs\)/);
    assert.match(read(dir, 'src/components/ui/tabs.tsx'), /my edit/);
    const o = run(['add', 'tabs', '--cwd', dir, '--overwrite']);
    assert.equal(o.status, 0);
    assert.doesNotMatch(read(dir, 'src/components/ui/tabs.tsx'), /my edit/);
  });

  it('updates silently a file that is unchanged since the last copy', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    // Simulate an older registry copy: the file on disk matches the lockfile hash but not the registry.
    const rel = 'src/components/ui/tabs.tsx';
    const old = '// old version\n';
    writeFileSync(join(dir, rel), old);
    const lock = JSON.parse(read(dir, 'deep-ink.json'));
    // sha256 of `old`, and the base copy that goes with it
    lock.items.tabs.files[rel] = createHash('sha256').update(old).digest('hex');
    writeFileSync(join(dir, 'deep-ink.json'), JSON.stringify(lock));
    writeFileSync(join(dir, '.deep-ink/base', rel), old);
    const r = run(['add', 'tabs', '--cwd', dir]);
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /updated\s+src\/components\/ui\/tabs\.tsx/);
    assert.match(read(dir, rel), /Deep Ink · tabs@/);
  });

  it('--dry-run writes nothing', () => {
    const dir = project();
    const r = run(['add', 'tabs', '--cwd', dir, '--dry-run']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /would add\s+src\/components\/ui\/tabs\.tsx/);
    assert.equal(existsSync(join(dir, 'src')), false);
    assert.equal(existsSync(join(dir, 'deep-ink.json')), false);
  });

  it('detects Angular from package.json', () => {
    const dir = project({ dependencies: { '@angular/core': '22', react: '19' } });
    const r = run(['init', '--cwd', dir]);
    assert.equal(r.status, 0, r.stderr);
    const lock = JSON.parse(read(dir, 'deep-ink.json'));
    assert.equal(lock.framework, 'angular');
    assert.equal(lock.out, 'src/app/ui');
    assert.match(r.stdout, /angular\.json/);
  });

  it('falls back to html recipes without react or angular', () => {
    const dir = project({ name: 'plain' });
    const r = run(['add', 'button', '--cwd', dir]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(dir, 'deep-ink/button.html')));
    assert.ok(existsSync(join(dir, 'deep-ink/css/button.css')));
    assert.equal(existsSync(join(dir, 'deep-ink/button.tsx')), false);
  });

  it('--all with --tier copies a whole tier', () => {
    const dir = project();
    const r = run(['add', '--all', '--tier', 'natural', '--cwd', dir]);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(dir, 'src/components/ui/dialog.tsx')));
  });

  it('rejects an unknown item and an unknown tier', () => {
    const dir = project();
    assert.equal(run(['add', 'nope', '--cwd', dir]).status, 1);
    assert.equal(run(['add', '--all', '--tier', 'weird', '--cwd', dir]).status, 1);
  });
});

describe('diff and view', () => {
  it('diff shows local changes against the registry', () => {
    const dir = project();
    run(['add', 'tabs', '--cwd', dir]);
    assert.match(run(['diff', 'tabs', '--cwd', dir]).stdout, /identical to the registry/);
    const rel = 'src/components/ui/tabs.tsx';
    writeFileSync(join(dir, rel), read(dir, rel).replace('Tabs with the WAI-ARIA tabs pattern', 'Mine'));
    const d = run(['diff', 'tabs', '--cwd', dir]).stdout;
    assert.match(d, /== src\/components\/ui\/tabs\.tsx: local edits \(base -> your file\)/);
    assert.match(d, /^--- base\/src\/components\/ui\/tabs\.tsx/m);
    assert.match(d, /^\+\+\+ local\/src\/components\/ui\/tabs\.tsx/m);
    assert.match(d, /^-.*Tabs with the WAI-ARIA tabs pattern/m);
    assert.match(d, /^\+.*Mine/m);
    assert.doesNotMatch(d, /upstream changes/);
  });

  it('view prints the files of an item', () => {
    const r = run(['view', 'tabs', '--framework', 'html']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /=== deep-ink\/tabs\.html ===/);
    assert.match(r.stdout, /role="tablist"/);
  });
});

describe('errors', () => {
  it('reports a missing registry with the build hint', () => {
    const dir = project();
    const r = run(['add', 'tabs', '--cwd', dir, '--registry', join(dir, 'nope.json')]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Run `pnpm build` in the Deep Ink repo first\./);
  });

  it('reports bad usage', () => {
    assert.equal(run(['bogus']).status, 1);
    assert.equal(run(['add', '--cwd', project()]).status, 1);
  });
});
