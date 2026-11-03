import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { checkPluginCss, loadTokenNames } from '../scripts/check-plugin-css.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(HERE, '..', 'scripts', 'check-plugin-css.mjs');
const TOKENS = resolve(HERE, '..', '..', 'tokens', 'tokens.json');
const tokenNames = loadTokenNames(TOKENS);
const check = (css) => checkPluginCss(css, 'acme-', { tokenNames });
const codes = (css) => check(css).violations.map((v) => v.code);

const temp = [];
after(() => temp.forEach((d) => rmSync(d, { recursive: true, force: true })));

describe('checkPluginCss', () => {
  it('reads the design tokens from packages/tokens', () => {
    for (const name of ['action', 'surface', 'bg', 'font-mono']) assert.ok(tokenNames.has(name), name);
  });

  it('accepts selectors scoped by the tagPrefix', () => {
    const r = check(`
      /* comment with html { } inside */
      acme-replay-widget { display: block; color: var(--text-secondary); }
      acme-replay-widget .row, acme-replay-widget button:hover { gap: var(--space-2); }
      acme-replay-widget[data-x="1"] > .cell::after { content: "}"; }
      @media (min-width: 600px) { acme-replay-widget .row { gap: 0 } }
      @layer acme { acme-replay-widget p { margin: 0 } }
      @keyframes acme-spin { from { opacity: 0 } to { opacity: 1 } }
      acme-replay-widget { --acme-gap: 4px; & .nested { color: red; } }
    `);
    assert.deepEqual(r.violations, []);
    assert.equal(r.ok, true);
  });

  it('rejects :root, html and body', () => {
    assert.deepEqual(codes(':root { --x: 1 }'), ['global-selector']);
    assert.deepEqual(codes('html { font-size: 20px }'), ['global-selector']);
    assert.deepEqual(codes('body { margin: 0 }'), ['global-selector']);
    assert.deepEqual(codes('acme-widget, body { margin: 0 }'), ['global-selector']);
  });

  it('rejects bare element, class, id and attribute selectors, and unscoped lists', () => {
    for (const sel of ['button', '.button', '#main', '[data-x]', '*', 'other-widget .row', '.row acme-widget']) {
      assert.deepEqual(codes(`${sel} { color: red }`), ['unscoped-selector'], sel);
    }
    assert.equal(check('acme-a .x, .y { color: red }').violations.length, 1);
  });

  it('does not treat a longer tag that merely starts like the prefix as scoped', () => {
    assert.deepEqual(codes('acmewidget { color: red }'), ['unscoped-selector']);
  });

  it('checks rules inside @media and @supports', () => {
    assert.deepEqual(codes('@media (min-width: 1px) { .row { color: red } }'), ['unscoped-selector']);
    assert.deepEqual(codes('@supports (display: grid) { body { color: red } }'), ['global-selector']);
  });

  it('rejects @layer deep-ink* and @import into it', () => {
    assert.deepEqual(codes('@layer deep-ink.components { acme-a .x { color: red } }'), ['layer-deep-ink']);
    assert.deepEqual(codes('@layer deep-ink { }'), ['layer-deep-ink']);
    assert.deepEqual(codes('@layer base, deep-ink.components;'), ['layer-deep-ink']);
    assert.deepEqual(codes('@import url(x.css) layer(deep-ink.components);'), ['layer-deep-ink']);
    assert.deepEqual(codes('@layer acme { acme-a { color: red } }'), []);
  });

  it('rejects an @import it cannot inspect', () => {
    assert.deepEqual(codes('@import "other.css";'), ['import']);
  });

  it('rejects the redefinition of a design token, even inside a scoped rule', () => {
    const r = check('acme-a {\n  color: red;\n  --action: hotpink;\n}');
    assert.deepEqual(r.violations.map((v) => v.code), ['token-redefined']);
    assert.equal(r.violations[0].line, 3);
    assert.deepEqual(codes('acme-a { --surface:#000 }'), ['token-redefined']);
    assert.deepEqual(codes('acme-a { color: red; & .x { --bg: red } }'), ['token-redefined']);
    assert.deepEqual(codes('@property --action { syntax: "<color>"; inherits: true; initial-value: red }'), ['token-redefined']);
    // Using a token, or declaring an own custom property, is fine.
    assert.deepEqual(codes('acme-a { color: var(--action); --acme-x: 1 }'), []);
  });

  it('reports line numbers', () => {
    const r = check('acme-a { color: red }\n\n.bad { color: red }\n');
    assert.equal(r.violations[0].line, 3);
    assert.equal(r.violations[0].selector, '.bad');
  });

  it('refuses an invalid tagPrefix', () => {
    assert.throws(() => checkPluginCss('a{}', 'acme'), /not valid/);
  });
});

describe('check-plugin-css CLI', () => {
  const dir = mkdtempSync(join(tmpdir(), 'css-'));
  temp.push(dir);
  const good = join(dir, 'good.css');
  const bad = join(dir, 'bad.css');
  const manifest = join(dir, 'microcks-plugin.json');
  writeFileSync(good, 'acme-a .row { color: var(--action) }\n');
  writeFileSync(bad, 'acme-a .row { color: red }\nbody { margin: 0 }\n:root { --action: red }\n');
  writeFileSync(manifest, JSON.stringify({ frontend: { tagPrefix: 'acme-' } }));
  const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });

  it('exits 0 on a clean file', () => {
    const r = run('--prefix', 'acme-', good);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /ok: 1 file/);
  });

  it('exits 1 and prints file:line for violations, reading the prefix from the manifest', () => {
    const r = run('--manifest', manifest, bad);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /bad\.css:2: global-selector/);
    assert.match(r.stdout, /bad\.css:3: global-selector/);
    assert.match(r.stdout, /bad\.css:3: token-redefined/);
  });

  it('exits 1 on bad usage', () => {
    assert.equal(run(good).status, 1);
    assert.equal(run('--prefix', 'acme-').status, 1);
    assert.equal(run('--prefix', 'acme-', join(dir, 'missing.css')).status, 1);
  });
});
