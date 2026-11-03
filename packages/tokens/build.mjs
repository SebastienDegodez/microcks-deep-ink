// Generates CSS custom properties, a JS module and TS types from tokens.json.
// Dark (Deep Ink) is the default theme; light (Paper) is enabled with data-theme="light".
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = JSON.parse(readFileSync(new URL('./tokens.json', import.meta.url), 'utf8'));
const out = new URL('./dist/', import.meta.url);
mkdirSync(out, { recursive: true });

const dark = {};
const light = {};
const shared = {};

const put = (name, value) => {
  if (value && typeof value === 'object') {
    dark[name] = value.dark;
    light[name] = value.light;
  } else {
    shared[name] = value;
  }
};

for (const t of src.color.tokens) put(t.name, t.value);
for (const t of src.spacing.tokens) put(t.name, t.value);
for (const t of src.radius.tokens) put(t.name, t.value);
for (const t of src.shadow.tokens) put(t.name, t.value);
for (const [k, v] of Object.entries(src.type.families)) put(`font-${k}`, v);
for (const g of src.type.groups) {
  for (const s of g.styles) {
    const fam = `var(--font-${g.family})`;
    put(`type-${s.name}`, `${s.fontWeight} ${s.fontSize}/${s.lineHeight} ${fam}`);
    if (s.letterSpacing) put(`type-${s.name}-tracking`, s.letterSpacing);
  }
}

const block = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `  --${k}: ${v};`)
    .join('\n');

const css = `/* Microcks Deep Ink tokens, generated from tokens.json. Do not edit. */
@import url('https://fonts.googleapis.com/css2?family=Alegreya+Sans+SC:wght@500;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
${block(shared)}
}

:root,
[data-theme="dark"] {
  color-scheme: dark;
${block(dark)}
}

[data-theme="light"] {
  color-scheme: light;
${block(light)}
}
`;

// Same file without the remote font import, for apps that self-host fonts.
const cssNoFonts = css.replace(/@import url\([^)]*\);\n/, '');

const all = { ...shared };
const themes = { dark, light };
const js = `// Generated from tokens.json. Do not edit.
export const shared = ${JSON.stringify(shared, null, 2)};
export const themes = ${JSON.stringify(themes, null, 2)};
export const tokens = ${JSON.stringify(src, null, 2)};
export const cssVar = (name) => \`var(--\${name})\`;
export default tokens;
`;

const names = [...new Set([...Object.keys(all), ...Object.keys(dark)])];
const dts = `// Generated from tokens.json. Do not edit.
export type TokenName =\n${names.map((n) => `  | '${n}'`).join('\n')};
export type ThemeId = 'dark' | 'light';
export declare const shared: Record<string, string>;
export declare const themes: Record<ThemeId, Record<string, string>>;
export declare const tokens: any;
export declare const cssVar: (name: TokenName) => string;
export default tokens;
`;

writeFileSync(new URL('deep-ink.css', out), css);
writeFileSync(new URL('deep-ink.no-fonts.css', out), cssNoFonts);
writeFileSync(new URL('index.js', out), js);
writeFileSync(new URL('index.d.ts', out), dts);
writeFileSync(new URL('tokens.json', out), JSON.stringify(src, null, 2));
console.log(`tokens: ${names.length} variables, 2 themes`);
