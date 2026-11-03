// @vitest-environment node
import { existsSync, readdirSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without types
import { buildRegistry } from '../scripts/build.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');

interface Entry {
  name: string;
  tier: string;
  cssOnly?: boolean;
  registryDependencies: string[];
  a11y: { keyboard: unknown[]; rgaa: string[]; wcag: string[]; aria: unknown[]; pattern: string };
  files: Record<'react' | 'angular' | 'html', Array<{ target: string; content?: string }>>;
  css: Array<{ target: string; content?: string }>;
}

let result: { ok: boolean; errors: string[]; index: { items: Entry[] }; full: { items: Entry[]; tokens: { css: string; cssNoFonts: string } }; css: string };

beforeAll(() => {
  result = buildRegistry({ write: false });
});

const itemNames = readdirSync(join(ROOT, 'items'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''));

describe('registry build', () => {
  it('succeeds and contains every item JSON', () => {
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.index.items.map((i) => i.name).sort()).toEqual([...itemNames].sort());
  });

  it('includes the 17 natural items owned by WP1', () => {
    const wp1 = ['tokens', 'base', 'icon', 'button', 'copy-button', 'field', 'input', 'select', 'checkbox', 'switch', 'tabs', 'chip', 'panel', 'table', 'dialog', 'menu', 'segmented'];
    for (const n of wp1) expect(itemNames).toContain(n);
  });

  it('gives every item keyboard, aria, rgaa and wcag documentation', () => {
    for (const item of result.index.items) {
      expect(Array.isArray(item.a11y.keyboard), `${item.name} keyboard`).toBe(true);
      expect(Array.isArray(item.a11y.aria), `${item.name} aria`).toBe(true);
      expect(item.a11y.rgaa.length, `${item.name} rgaa`).toBeGreaterThan(0);
      expect(item.a11y.wcag.length, `${item.name} wcag`).toBeGreaterThan(0);
      expect(item.a11y.pattern.length, `${item.name} pattern`).toBeGreaterThan(0);
    }
  });

  it('gives every item a content hash version, in both outputs, that does not depend on the copy header', () => {
    for (const item of result.full.items) {
      const h = (item as unknown as { hash: string }).hash;
      expect(h, item.name).toMatch(/^[0-9a-f]{16}$/);
      expect((result.index.items.find((i) => i.name === item.name) as unknown as { hash: string }).hash).toBe(h);
    }
    const hashes = result.full.items.map((i) => (i as unknown as { hash: string }).hash);
    expect(new Set(hashes).size).toBeGreaterThan(hashes.length / 2);
    expect(buildRegistry({ write: false }).full.items.map((i: Entry) => (i as unknown as { hash: string }).hash)).toEqual(hashes);
  });

  it('puts the copy header on every file of the full registry', () => {
    for (const item of result.full.items) {
      for (const f of [...item.files.react, ...item.files.angular, ...item.files.html, ...item.css]) {
        expect(f.content, `${item.name}/${f.target}`).toMatch(new RegExp(`Deep Ink · ${item.name}@0\\.2\\.0 · copied from packages/registry\\. You own this file\\.`));
      }
    }
  });

  it('does not leak content into the index', () => {
    for (const item of result.index.items) for (const f of [...item.files.react, ...item.css]) expect(f.content).toBeUndefined();
  });

  it('lists dependencies before dependents in the concatenated CSS', () => {
    const marks = [...result.css.matchAll(/\/\* ── ([a-z-]+) ── \*\//g)].map((m) => m[1]);
    expect(marks[0]).toBe('base');
    for (const item of result.index.items) {
      const at = marks.indexOf(item.name);
      if (at < 0) continue;
      for (const dep of item.registryDependencies) {
        const d = marks.indexOf(dep);
        if (d >= 0) expect(d, `${dep} before ${item.name}`).toBeLessThan(at);
      }
    }
  });

  it('exposes tokens for the Storybook panel and the CLI', () => {
    expect(result.full.tokens.css).toContain('--border-control');
    expect(result.full.tokens.cssNoFonts).not.toContain('fonts.googleapis.com');
  });
});

describe('CSS rules', () => {
  const cssFiles = readdirSync(join(ROOT, 'src', 'css')).map((f) => ({ f, text: readFileSync(join(ROOT, 'src', 'css', f), 'utf8') }));
  // The modal backdrop sits behind the dialog, never behind text.
  const strip = (t: string) => t.replace(/::backdrop\s*\{[^}]*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

  it('has no color-mix', () => {
    for (const { f, text } of cssFiles) expect(strip(text), f).not.toMatch(/color-mix\(/);
  });

  it('has no alpha backgrounds', () => {
    for (const { f, text } of cssFiles) {
      expect(strip(text), f).not.toMatch(/background(-color)?\s*:[^;]*(rgba|hsla)\(/i);
      expect(strip(text), f).not.toMatch(/background(-color)?\s*:[^;]*#[0-9a-f]{8}\b/i);
      expect(strip(text), f).not.toMatch(/background(-color)?\s*:[^;]*(rgb|hsl)\([^)]*\/[^)]*\)/i);
    }
  });

  it('never removes the outline without a replacement', () => {
    for (const { f, text } of cssFiles) expect(strip(text), f).not.toMatch(/outline\s*:\s*(none|0)\b/);
  });

  it('wraps component CSS in the components layer', () => {
    for (const { f, text } of cssFiles) {
      if (f === 'base.css') continue;
      expect(text, f).toMatch(/@layer deep-ink\.components\s*\{/);
    }
  });

  it('declares the layer order in base.css', () => {
    expect(readFileSync(join(ROOT, 'src', 'css', 'base.css'), 'utf8')).toContain('@layer deep-ink.base, deep-ink.components;');
  });
});

describe('registry validation', () => {
  const scratch = (setup: (root: string) => void) => {
    const root = mkdtempSync(join(tmpdir(), 'reg-'));
    try {
      cpSync(join(ROOT, 'registry.schema.json'), join(root, 'registry.schema.json'));
      cpSync(join(ROOT, 'package.json'), join(root, 'package.json'));
      mkdirSync(join(root, 'items'), { recursive: true });
      for (const d of ['css', 'react', 'html']) mkdirSync(join(root, 'src', d), { recursive: true });
      setup(root);
      return buildRegistry({ write: false, root, syncElementsFiles: false });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };
  const meta = (name: string, deps: string[] = [], extra: object = {}) => ({
    name,
    title: name,
    tier: 'natural',
    description: 'x',
    cssOnly: true,
    registryDependencies: deps,
    a11y: { pattern: 'p', keyboard: [], aria: [], rgaa: ['1.1'], wcag: ['1.1.1'] },
    ...extra,
  });
  const put = (root: string, m: ReturnType<typeof meta>) => writeFileSync(join(root, 'items', `${m.name}.json`), JSON.stringify(m));

  it('changes the item hash when, and only when, a file of the item changes', () => {
    const build = (css: string, other = 'x') =>
      scratch((root) => {
        put(root, meta('a', [], { cssOnly: false }));
        put(root, meta('b', [], { cssOnly: false }));
        writeFileSync(join(root, 'src', 'css', 'a.css'), css);
        writeFileSync(join(root, 'src', 'css', 'b.css'), other);
      });
    const hashOf = (r: ReturnType<typeof build>, name: string) => (r.full.items.find((i: Entry) => i.name === name) as unknown as { hash: string }).hash;
    const one = build('a{}');
    const same = build('a{}');
    const edited = build('a{color:red}');
    const otherEdited = build('a{}', 'y');
    expect(hashOf(same, 'a')).toBe(hashOf(one, 'a'));
    expect(hashOf(edited, 'a')).not.toBe(hashOf(one, 'a'));
    expect(hashOf(edited, 'b')).toBe(hashOf(one, 'b'));
    expect(hashOf(otherEdited, 'a')).toBe(hashOf(one, 'a'));
    expect(hashOf(otherEdited, 'b')).not.toBe(hashOf(one, 'b'));
  });

  it('rejects an unknown dependency', () => {
    const r = scratch((root) => put(root, meta('a', ['ghost'])));
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('unknown registry dependency "ghost"');
  });

  it('rejects a dependency cycle', () => {
    const r = scratch((root) => {
      put(root, meta('a', ['b']));
      put(root, meta('b', ['a']));
    });
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('dependency cycle');
  });

  it('rejects a missing CSS file on a non-element item', () => {
    const r = scratch((root) => put(root, meta('a', [], { cssOnly: false })));
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('missing CSS file src/css/a.css');
  });

  it('rejects a schema error', () => {
    const r = scratch((root) => put(root, meta('a', [], { tier: 'weird' })));
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toContain('tier');
  });

  it('warns about missing framework folders and fails on them with strict', () => {
    const setup = (root: string) => {
      put(root, meta('a', [], { cssOnly: false }));
      writeFileSync(join(root, 'src', 'css', 'a.css'), '@layer deep-ink.components {}');
    };
    const loose = scratch(setup);
    expect(loose.ok).toBe(true);
    expect(loose.warnings.join('\n')).toContain('a: no react, angular, html files yet');
    const root = mkdtempSync(join(tmpdir(), 'reg-'));
    try {
      cpSync(join(ROOT, 'registry.schema.json'), join(root, 'registry.schema.json'));
      cpSync(join(ROOT, 'package.json'), join(root, 'package.json'));
      mkdirSync(join(root, 'items'), { recursive: true });
      mkdirSync(join(root, 'src', 'css'), { recursive: true });
      setup(root);
      const strict = buildRegistry({ write: false, root, strict: true, syncElementsFiles: false });
      expect(strict.ok).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('builds an element item whose bundle is not synced', () => {
    const r = scratch((root) => {
      put(root, meta('loom', [], { cssOnly: false, tier: 'element', elements: ['mk-nope'] }));
    });
    expect(r.ok).toBe(true);
    expect(existsSync(join(ROOT, 'src', 'react', 'elements', 'mk-nope.js'))).toBe(false);
  });
});
