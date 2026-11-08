// Read public native component exports from the built Svelte barrel, grouped by registry item.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(app, 'node_modules/@microcks/deep-ink/dist');
const barrel = readFileSync(join(dist, 'index.d.ts'), 'utf8');
const map = {};
const byComponent = {};
for (const item of readdirSync(dist, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
  for (const file of readdirSync(join(dist, item.name))) {
    if (/^[A-Z].*\.svelte\.d\.ts$/.test(file)) byComponent[file.replace(/\.svelte\.d\.ts$/, '')] = item.name;
  }
}
for (const [, name, path] of barrel.matchAll(/export \{ default as (\w+) \} from ['"]\.\/([^'"]+)['"]/g)) {
  const item = path.includes('/') ? path.split('/')[0] : byComponent[name];
  if (item) (map[item] ??= []).push(name);
}
for (const [, path] of barrel.matchAll(/export \* from ['"]\.\/([^'"]+)\.js['"]/g)) {
  const declaration = join(dist, `${path}.d.ts`);
  if (!existsSync(declaration) || !path.includes('/')) continue;
  const names = [...readFileSync(declaration, 'utf8').matchAll(/^export declare (?:function|const|class|let) (\w+)/gm)].map((match) => match[1]);
  map[path.split('/')[0]] = [...new Set([...(map[path.split('/')[0]] ?? []), ...names])];
}
for (const [name, item] of Object.entries({ MethodTag: 'method-tag', StatusBadge: 'status-badge', LiveIndicator: 'live-indicator', SummaryStrip: 'summary-strip', SummaryStripSep: 'summary-strip' })) {
  if (barrel.includes(`default as ${name} }`)) map[item] = [...new Set([...(map[item] ?? []), name])];
}
mkdirSync(join(app, '.storybook/copy-panel'), { recursive: true });
writeFileSync(join(app, '.storybook/copy-panel/exports.generated.json'), JSON.stringify(map, null, 2) + '\n');
console.log(`copy panel: exports of ${Object.keys(map).length} native modules`);
