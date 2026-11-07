// scripts/gen-index.mjs: the barrel only lists the items that have a src/lib/<item>/ folder.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script, no declarations
import { barrel, items, pending } from '../scripts/gen-index.mjs';

const dirs: string[] = [];
const lib = (files: Record<string, string> = {}) => {
  const dir = mkdtempSync(join(__dirname, '..', '.gen-index-'));
  dirs.push(dir);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
};
afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

describe('gen-index', () => {
  it('generates a valid empty module when no item is implemented, and lists every item as pending', () => {
    const dir = lib();
    expect(barrel(dir)).toBe('// Generated from packages/registry/items by scripts/gen-index.mjs. Do not edit.\nexport {};\n');
    expect(pending(dir)).toEqual(items());
    expect(items()).toContain('kbd');
    expect(items()).not.toContain('base');
  });

  it('exports PascalCase components by file name, then the .ts modules, skipping specs and private parts', () => {
    const dir = lib({
      'table/DataTable.svelte': '',
      'table/_Row.svelte': '',
      'table/cell.svelte': '',
      'table/table.ts': '',
      'table/state.svelte.ts': '',
      'table/table.spec.ts': '',
      'table/table.ssr.test.ts': '',
      'kbd/Kbd.svelte': '',
    });
    expect(barrel(dir).split('\n').slice(1)).toEqual([
      "export { default as Kbd } from './kbd/Kbd.svelte';",
      "export { default as DataTable } from './table/DataTable.svelte';",
      "export * from './table/state.svelte.js';",
      "export * from './table/table.js';",
      '',
    ]);
    expect(pending(dir)).not.toContain('table');
  });

  it('rejects a folder that is not a registry item, and an item folder with nothing to export', () => {
    expect(() => barrel(lib({ 'not-an-item/Foo.svelte': '' }))).toThrow(/not a registry item/);
    expect(() => barrel(lib({ 'kbd/notes.md': '' }))).toThrow(/no PascalCase/);
  });

  it('preserves native overrides, upstream components and the private helper folder', () => {
    const dir = lib({
      'Button.svelte': '',
      'StatusBadge.svelte': '',
      'internal/ButtonIcon.svelte': '',
      'button/Button.svelte': '',
      'button/button.ts': '',
      'kbd/Kbd.svelte': '',
    });
    const text = barrel(dir);
    expect(text).toContain("export { default as Button } from './Button.svelte';");
    expect(text).not.toContain("from './button/Button.svelte'");
    expect(text).toContain("export * from './button/button.js';");
    expect(text).toContain("export { default as Kbd } from './kbd/Kbd.svelte';");
    expect(text).toContain("export { default as StatusBadge } from './StatusBadge.svelte';");
    expect(text).not.toContain("from './internal/");
    expect(pending(dir)).not.toContain('status-badge');
  });
});
