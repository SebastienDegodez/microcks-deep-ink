// @vitest-environment node
// React half of the Svelte parity harness. packages/registry/parity/<item>.cases.json lists render cases:
//   { "component": "Kbd", "cases": [{ "name": "default", "props": { "className": "x" }, "children": "K" }] }
// Each case is rendered with renderToStaticMarkup into <item>.<case>.html, committed and compared by the Svelte
// workspace (svelte/packages/deep-ink/test/parity). This test fails when a committed file is stale or orphaned;
// `pnpm parity` (PARITY_WRITE=1) rewrites them.
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

const PARITY = join(__dirname, '..', 'node_modules', '@microcks-deep-ink', 'registry', 'parity');
const WRITE = process.env.PARITY_WRITE === '1';

interface Case {
  name: string;
  /** Another export of the same item (Textarea in input), instead of the file's `component`. */
  component?: string;
  props?: Record<string, unknown>;
  children?: string;
}

const files = existsSync(PARITY) ? readdirSync(PARITY) : [];
const expected = new Set<string>();

for (const file of files.filter((f) => f.endsWith('.cases.json')).sort()) {
  const item = file.replace(/\.cases\.json$/, '');
  const { component, cases } = JSON.parse(readFileSync(join(PARITY, file), 'utf8')) as { component: string; cases: Case[] };
  describe(`parity: ${item} (${component})`, () => {
    for (const c of cases) {
      const out = `${item}.${c.name}.html`;
      expected.add(out);
      it(c.name, async () => {
        const name = c.component ?? component;
        const mod = (await import(`../src/${item}.tsx`)) as Record<string, ComponentType<Record<string, unknown>>>;
        expect(mod[name], `${name} is not exported by src/${item}.tsx`).toBeTypeOf('function');
        const html = renderToStaticMarkup(createElement(mod[name]!, c.props ?? {}, c.children)) + '\n';
        if (WRITE) writeFileSync(join(PARITY, out), html);
        else expect(existsSync(join(PARITY, out)) ? readFileSync(join(PARITY, out), 'utf8') : '', `${out} is stale: run \`pnpm parity\``).toBe(html);
      });
    }
  });
}

describe('parity files', () => {
  it('has no orphaned .html file', () => {
    const orphans = files.filter((f) => f.endsWith('.html') && !expected.has(f));
    if (WRITE) orphans.forEach((f) => rmSync(join(PARITY, f)));
    else expect(orphans).toEqual([]);
  });
});
