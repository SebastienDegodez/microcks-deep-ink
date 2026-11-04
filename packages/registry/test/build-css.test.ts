// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without types
import { buildCss, LAYER_ORDER } from '../scripts/build-css.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const DEMO_STYLES = resolve(ROOT, '..', '..', 'apps', 'demo-react', 'src', 'ui', 'styles');

let out: { css: string; cssNoFonts: string; order: string[] };

beforeAll(() => {
  out = buildCss({ write: false });
});

/** Drops the comments (copy headers, section marks) and blank lines: what is left is what the browser reads. */
const rules = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter(Boolean)
    .join('\n');

describe('dist/deep-ink.css', () => {
  it('starts with the layer order, then the tokens font import', () => {
    const lines = rules(out.css).split('\n');
    expect(lines[0]).toBe(LAYER_ORDER);
    expect(lines[1]).toMatch(/^@import url\('https:\/\/fonts\.googleapis\.com\//);
    expect(rules(out.cssNoFonts)).not.toContain('fonts.googleapis.com');
  });

  it('keeps the tokens unlayered and every component in its layer', () => {
    const tokens = readFileSync(resolve(ROOT, '..', 'tokens', 'dist', 'deep-ink.css'), 'utf8');
    expect(out.css).toContain(tokens);
    for (const n of out.order.filter((x) => x !== 'base')) {
      expect(readFileSync(join(ROOT, 'src', 'css', `${n}.css`), 'utf8'), n).toMatch(/@layer deep-ink\.components\s*\{/);
    }
  });

  it('contains every stylesheet of the registry once, base first, dependencies before dependents', () => {
    const files = readdirSync(join(ROOT, 'src', 'css')).map((f) => f.replace(/\.css$/, ''));
    expect([...out.order].sort()).toEqual([...files].sort());
    expect(new Set(out.order).size).toBe(out.order.length);
    expect(out.order[0]).toBe('base');
    for (const n of out.order) {
      const deps: string[] = JSON.parse(readFileSync(join(ROOT, 'items', `${n}.json`), 'utf8')).registryDependencies;
      for (const d of deps) if (out.order.includes(d)) expect(out.order.indexOf(d), `${d} before ${n}`).toBeLessThan(out.order.indexOf(n));
    }
  });

  // The demo's copies (CLI output) are what the demo renders today: the package stylesheet must be the same cascade.
  it('equals the demo copies, in the order of its index.css', () => {
    const imports = [...readFileSync(join(DEMO_STYLES, 'index.css'), 'utf8').matchAll(/@import '\.\/([^']+)';/g)].map((m) => m[1]!);
    const demo = imports.map((f) => readFileSync(join(DEMO_STYLES, f), 'utf8')).join('\n');
    expect(rules(out.css)).toBe(`${LAYER_ORDER}\n${rules(demo)}`);
  });
});
