// Parity with React. packages/registry/parity/<item>.cases.json lists render cases:
//   { "component": "Kbd", "cases": [{ "name": "default", "props": { "className": "x" }, "children": "K" }] }
// The React workspace renders each case with renderToStaticMarkup into <item>.<case>.html (committed; regenerate with
// `pnpm -C react/packages/deep-ink parity`). Here the Svelte component renders the same case with svelte/server, and
// both are compared through normaliseHtml.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Component } from 'svelte';
import { render } from 'svelte/server';
import * as barrel from '../../src/lib/index';
import Harness from './Harness.svelte';
import { normaliseHtml } from './normalise';

export const PARITY = join(__dirname, '..', '..', 'node_modules', '@microcks-deep-ink', 'registry', 'parity');

export interface ParityCase {
  name: string;
  /** Another export of the same item (Textarea in input), instead of the file's `component`. */
  component?: string;
  props?: Record<string, unknown>;
  /** A text child, or an array of text children: React gets it as one array child, Svelte as the `children` prop. */
  children?: string | string[];
  /** `<option>` children (Select), instead of `children`. */
  options?: ParityOption[];
  /** Render-prop child (Field): the named export of the package, given the control props and `props`. */
  control?: { component: string; props?: Record<string, unknown> };
}
export interface ParityOption {
  label: string;
  value?: string;
  disabled?: boolean;
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

/** A JSON stand-in for a function prop: `{ "$fn": "tone" }` is `(x) => x.tone` (rowTone, rowHref...). */
export const decode = (props: Record<string, unknown> = {}) =>
  Object.fromEntries(
    Object.entries(props).map(([k, v]) => [k, v && typeof v === 'object' && '$fn' in v ? (x: Record<string, unknown>) => x[(v as { $fn: string }).$fn] : v]),
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function svelteHtml(component: Component<any>, c: ParityCase): string {
  const props = { ...c.props, ...(c.props?.style && typeof c.props.style === 'object' ? { style: styleString(c.props.style as Record<string, string>) } : {}) };
  const control = c.control && { component: (barrel as Record<string, unknown>)[c.control.component], props: c.control.props };
  return render(Harness, { props: { component, props: decode(props), text: c.children, options: c.options, control } }).body;
}

/** A React `style` object of a case as the Svelte `style` string: `{ "--x": "1px", "fontSize": "2px" }` -> `--x:1px;font-size:2px`. */
function styleString(style: Record<string, string>): string {
  return Object.entries(style).map(([k, v]) => `${k.startsWith('--') ? k : k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`).join(';');
}

/** Both sides normalised, ready for `expect(svelte).toBe(react)`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parity(component: Component<any>, item: string, c: ParityCase, dir = PARITY) {
  return { svelte: normaliseHtml(svelteHtml(component, c)), react: normaliseHtml(reactHtml(item, c.name, dir)) };
}
