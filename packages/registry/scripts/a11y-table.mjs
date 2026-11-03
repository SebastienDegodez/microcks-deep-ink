#!/usr/bin/env node
// Prints the per-component accessibility table (item -> RGAA themes and criteria, WCAG, pattern) as Markdown,
// generated from items/*.json. Used by docs/accessibility.md:  node packages/registry/scripts/a11y-table.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../items');
const THEMES = {
  1: 'Images', 2: 'Frames', 3: 'Colors', 4: 'Multimedia', 5: 'Tables', 6: 'Links', 7: 'Scripts', 8: 'Mandatory elements',
  9: 'Structure', 10: 'Presentation', 11: 'Forms', 12: 'Navigation', 13: 'Consultation',
};
const items = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const order = { natural: 0, microcks: 1, element: 2, foundation: 3 };
items.sort((a, b) => (order[a.tier] ?? 9) - (order[b.tier] ?? 9) || a.name.localeCompare(b.name));
const num = (id) => id.split('.').map(Number);
const cmp = (a, b) => num(a)[0] - num(b)[0] || num(a)[1] - num(b)[1];

const lines = ['| Item | Tier | Pattern | RGAA criteria | WCAG |', '| --- | --- | --- | --- | --- |'];
for (const it of items) {
  const a = it.a11y;
  if (!a) continue;
  const rgaa = [...(a.rgaa ?? [])].sort(cmp).join(', ');
  lines.push(`| \`${it.name}\` | ${it.tier} | ${String(a.pattern ?? '').replace(/\|/g, '/').replace(/</g, '&lt;').replace(/>/g, '&gt;')} | ${rgaa || '–'} | ${(a.wcag ?? []).join(', ') || '–'} |`);
}
const themes = new Map();
for (const it of items) for (const r of it.a11y?.rgaa ?? []) {
  const t = Number(r.split('.')[0]);
  themes.set(t, (themes.get(t) ?? new Set()).add(it.name));
}
lines.push('', '| RGAA theme | Items that cite it |', '| --- | --- |');
for (const t of [...themes.keys()].sort((a, b) => a - b)) lines.push(`| ${t}. ${THEMES[t]} | ${themes.get(t).size} |`);
console.log(lines.join('\n'));
