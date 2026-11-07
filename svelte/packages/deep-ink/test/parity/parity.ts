// Parity with React. packages/registry/parity/<item>.cases.json lists render cases:
//   { "component": "Kbd", "cases": [{ "name": "default", "props": { "className": "x" }, "children": "K" }] }
// The React workspace renders each case with renderToStaticMarkup into <item>.<case>.html (committed; regenerate with
// `pnpm -C react/packages/deep-ink parity`). Here the Svelte component renders the same case with svelte/server, and
// both are compared through normaliseHtml.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import Harness from './Harness.svelte';
import { normaliseHtml } from './normalise';

export const PARITY = join(__dirname, '..', '..', 'node_modules', '@microcks-deep-ink', 'registry', 'parity');

export interface ParityCase {
  name: string;
  props?: Record<string, unknown>;
  children?: string;
}
export interface ParityItem {
  item: string;
  component: string;
  cases: ParityCase[];
}

export function parityItems(dir = PARITY): ParityItem[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.cases.json'))
    .sort()
    .map((f) => ({ item: f.replace(/\.cases\.json$/, ''), ...(JSON.parse(readFileSync(join(dir, f), 'utf8')) as Omit<ParityItem, 'item'>) }));
}

/** The React markup of a case, as committed by the React parity script. */
export function reactHtml(item: string, name: string, dir = PARITY): string {
  return readFileSync(join(dir, `${item}.${name}.html`), 'utf8');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function svelteHtml(component: Component<any>, c: ParityCase): string {
  return render(Harness, { props: { component, props: c.props ?? {}, text: c.children } }).body;
}

/** Both sides normalised, ready for `expect(svelte).toBe(react)`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parity(component: Component<any>, item: string, c: ParityCase, dir = PARITY) {
  return { svelte: normaliseHtml(svelteHtml(component, c)), react: normaliseHtml(reactHtml(item, c.name, dir)) };
}
