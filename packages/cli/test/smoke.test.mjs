// Smoke run of the CLI against a fresh temporary app, one per framework: init, add --all, status, diff.
// It is what proves that a copy is complete and self-contained, without relying on apps/demo-react.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(HERE, '..', 'bin', 'deep-ink.mjs');
const REGISTRY = resolve(HERE, '..', '..', 'registry', 'dist', 'registry.full.json');

const run = (args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } });

const temp = [];
after(() => {
  for (const d of temp) rmSync(d, { recursive: true, force: true });
});
before(() => {
  assert.ok(existsSync(REGISTRY), 'build the registry first: pnpm --filter @microcks-deep-ink/registry build');
});

const APPS = {
  react: { deps: { react: '^19.0.0', 'react-dom': '^19.0.0' }, ext: /\.tsx?$/ },
  angular: { deps: { '@angular/core': '^22.0.0' }, ext: /\.ts$/ },
};

for (const [framework, app] of Object.entries(APPS)) {
  describe(`smoke: a fresh ${framework} app`, () => {
    const dir = mkdtempSync(join(tmpdir(), `cli-smoke-${framework}-`));
    temp.push(dir);
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: `smoke-${framework}`, private: true, dependencies: app.deps }));
    const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
    let lock;

    it('init detects the framework and copies the foundations', () => {
      const r = run(['init', '--cwd', dir]);
      assert.equal(r.status, 0, r.stderr);
      lock = JSON.parse(readFileSync(join(dir, 'deep-ink.json'), 'utf8'));
      assert.equal(lock.framework, framework);
      assert.deepEqual(Object.keys(lock.items).sort(), ['base', 'tokens']);
    });

    it('add --all copies every item that ships files for the framework', () => {
      const r = run(['add', '--all', '--cwd', dir]);
      assert.equal(r.status, 0, r.stderr + r.stdout);
      lock = JSON.parse(readFileSync(join(dir, 'deep-ink.json'), 'utf8'));
      assert.deepEqual(Object.keys(lock.items).sort(), registry.items.map((i) => i.name).sort());
      for (const [name, entry] of Object.entries(lock.items)) {
        for (const rel of Object.keys(entry.files)) assert.ok(existsSync(join(dir, rel)), `${name}: ${rel}`);
      }
    });

    it('writes an index.css that imports every copied stylesheet, tokens first', () => {
      const index = readFileSync(join(dir, lock.cssOut, 'index.css'), 'utf8');
      const imports = [...index.matchAll(/@import '\.\/([^']+)';/g)].map((m) => m[1]);
      assert.equal(imports[0], 'tokens.css');
      assert.equal(imports[1], 'base.css');
      const css = Object.values(lock.items).flatMap((e) => Object.keys(e.files)).filter((f) => f.endsWith('.css'));
      assert.deepEqual([...imports].sort(), css.map((f) => f.slice(lock.cssOut.length + 1)).sort());
    });

    it('copies self-contained code: every relative import resolves to a copied file', () => {
      const code = Object.values(lock.items)
        .flatMap((e) => Object.keys(e.files))
        .filter((f) => app.ext.test(f) && !f.endsWith('.d.ts'));
      assert.ok(code.length > 20, `${code.length} ${framework} files`);
      for (const rel of code) {
        const text = readFileSync(join(dir, rel), 'utf8');
        for (const [, spec] of text.matchAll(/(?:from|import)\s+'(\.[^']+)'/g)) {
          const base = resolve(dir, dirname(rel), spec);
          const found = [base, `${base}.ts`, `${base}.tsx`].some((p) => existsSync(p) && !p.endsWith('/'));
          assert.ok(found, `${rel} imports ${spec}`);
        }
      }
      for (const tag of ['workflow-loom', 'plugin-slot']) assert.ok(existsSync(join(dir, lock.out, 'elements', `${tag}.js`)), tag);
      // command-bar is a native component: no element bundle.
      assert.ok(!existsSync(join(dir, lock.out, 'elements', 'command-bar.js')), 'command-bar has no element bundle');
    });

    it('status reports everything up to date and diff finds nothing', () => {
      const status = run(['status', '--exit-code', '--cwd', dir]);
      assert.equal(status.status, 0, status.stdout);
      assert.match(status.stdout, /all up to date/);
      const diff = run(['diff', 'button', '--exit-code', '--cwd', dir]);
      assert.equal(diff.status, 0, diff.stdout);
      assert.match(diff.stdout, /button: identical to the registry/);
    });

    it('status and diff see a local edit', () => {
      const rel = Object.keys(lock.items.button.files).find((f) => app.ext.test(f));
      writeFileSync(join(dir, rel), readFileSync(join(dir, rel), 'utf8') + '\n// local edit\n');
      const status = run(['status', 'button', '--exit-code', '--cwd', dir]);
      assert.equal(status.status, 1);
      assert.match(status.stdout, /button\s+locally modified/);
      const diff = run(['diff', 'button', '--exit-code', '--cwd', dir]);
      assert.equal(diff.status, 1);
      assert.match(diff.stdout, /\+\/\/ local edit/);
    });
  });
}
