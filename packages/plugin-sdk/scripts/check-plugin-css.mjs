#!/usr/bin/env node
// Checks the CSS of a Microcks plugin against the plugin CSS rule (docs/plugins.md). Zero dependencies.
//
//   node check-plugin-css.mjs --prefix acme- [--tokens FILE] <file.css...>
//   node check-plugin-css.mjs --manifest microcks-plugin.json [--tokens FILE] <file.css...>
//
// The host owns all design-system CSS. A plugin stylesheet is accepted when every selector is scoped by the
// plugin's tagPrefix and it declares no global rule, no `@layer deep-ink*` and no design token.
// Exit code: 0 clean, 1 violations or bad usage.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TOKENS = resolve(HERE, '..', '..', 'tokens', 'tokens.json');

/** Names of the design tokens (without `--`), derived like packages/tokens/build.mjs does. */
export function tokenNamesFromJson(json) {
  const names = new Set();
  for (const group of ['color', 'spacing', 'radius', 'shadow']) for (const t of json[group]?.tokens ?? []) names.add(t.name);
  for (const k of Object.keys(json.type?.families ?? {})) names.add(`font-${k}`);
  for (const g of json.type?.groups ?? []) {
    for (const s of g.styles ?? []) {
      names.add(`type-${s.name}`);
      if (s.letterSpacing) names.add(`type-${s.name}-tracking`);
    }
  }
  return names;
}

/** Token names from a tokens.json or from a CSS file that declares `--name:` custom properties. */
export function loadTokenNames(file) {
  const text = readFileSync(file, 'utf8');
  if (file.endsWith('.css')) return new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1].slice(2)));
  return tokenNamesFromJson(JSON.parse(text));
}

/** Replaces comments with spaces, keeping newlines so offsets still map to lines. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

/** Splits at top-level `char`, ignoring parentheses, brackets and strings. */
function splitTop(text, char) {
  const parts = [];
  let depth = 0;
  let quote = '';
  let cur = '';
  for (const c of text) {
    if (quote) {
      if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === char && depth === 0) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  parts.push(cur);
  return parts;
}

/** Reads blocks at one nesting level: [{ prelude, body|null, offset }]. `body === null` for statements. */
function readBlocks(css, base = 0) {
  const blocks = [];
  let i = 0;
  while (i < css.length) {
    let j = i;
    let quote = '';
    let paren = 0;
    while (j < css.length) {
      const c = css[j];
      if (quote) {
        if (c === quote) quote = '';
      } else if (c === '"' || c === "'") quote = c;
      else if (c === '(') paren++;
      else if (c === ')') paren--;
      else if (paren <= 0 && (c === '{' || c === ';' || c === '}')) break;
      j++;
    }
    const prelude = css.slice(i, j);
    const lead = prelude.length - prelude.trimStart().length;
    if (j >= css.length || css[j] === '}') {
      if (prelude.trim()) blocks.push({ prelude, body: null, offset: base + i + lead });
      i = j + 1;
    } else if (css[j] === ';') {
      if (prelude.trim()) blocks.push({ prelude, body: null, offset: base + i + lead });
      i = j + 1;
    } else {
      let depth = 1;
      let k = j + 1;
      quote = '';
      while (k < css.length && depth > 0) {
        const c = css[k];
        if (quote) {
          if (c === quote) quote = '';
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '{') depth++;
        else if (c === '}') depth--;
        k++;
      }
      blocks.push({ prelude, body: css.slice(j + 1, k - 1), offset: base + i + lead, bodyOffset: base + j + 1 });
      i = k;
    }
  }
  return blocks;
}

const NESTED_AT = /^@(media|supports|container|document|scope|starting-style)\b/i;
const FORBIDDEN_IN_SELECTOR = /(^|[^\w-.#\\[:])(html|body)(?![\w-])|:root(?![\w-])/i;

/**
 * Checks a stylesheet.
 * @param {string} cssText
 * @param {string} tagPrefix e.g. "acme-"
 * @param {{ tokenNames?: Iterable<string> }} [options] names of the design tokens a plugin must not redefine
 * @returns {{ ok: boolean, violations: Array<{ line: number, code: string, message: string, selector?: string }> }}
 */
export function checkPluginCss(cssText, tagPrefix, options = {}) {
  if (typeof tagPrefix !== 'string' || !/^[a-z][a-z0-9]*-$/.test(tagPrefix)) {
    throw new Error(`tagPrefix "${tagPrefix}" is not valid (for example "acme-")`);
  }
  const tokens = new Set(options.tokenNames ?? []);
  const css = stripComments(cssText);
  const violations = [];
  const lineOf = (offset) => css.slice(0, offset).split('\n').length;
  const report = (offset, code, message, selector) => violations.push({ line: lineOf(offset), code, message, ...(selector ? { selector } : {}) });

  const scopedStart = new RegExp(`^(?:${tagPrefix}[a-z0-9-]*)(?![\\w-])`);
  const checkDeclarations = (body, offset) => {
    for (const m of body.matchAll(/(?:^|[;{}\s])--([\w-]+)\s*:/g)) {
      if (tokens.has(m[1])) report(offset + m.index, 'token-redefined', `Redefines the design token --${m[1]}; the host owns the tokens.`);
    }
  };

  const checkRules = (source, base, inScopedRule) => {
    for (const block of readBlocks(source, base)) {
      const prelude = block.prelude.trim();
      if (prelude.startsWith('@')) {
        const name = /^@([\w-]+)/.exec(prelude)?.[1]?.toLowerCase();
        if (name === 'import') {
          if (/deep-ink/i.test(prelude)) report(block.offset, 'layer-deep-ink', '@import into a deep-ink layer is reserved for the host.');
          else report(block.offset, 'import', '@import pulls in CSS this check cannot see; bundle it into the plugin stylesheet.');
        } else if (name === 'layer') {
          const names = prelude.replace(/^@layer/i, '').split(',').map((n) => n.trim());
          if (names.some((n) => /^deep-ink(\.|$)/.test(n))) {
            report(block.offset, 'layer-deep-ink', '@layer deep-ink* is reserved for the host; an own copy would merge into the host layer.');
          }
          if (block.body !== null) checkRules(block.body, block.bodyOffset, inScopedRule);
        } else if (name === 'property') {
          const prop = /^@property\s+--([\w-]+)/i.exec(prelude)?.[1];
          if (prop && tokens.has(prop)) report(block.offset, 'token-redefined', `@property redefines the design token --${prop}.`);
        } else if (block.body !== null && NESTED_AT.test(prelude)) {
          checkRules(block.body, block.bodyOffset, inScopedRule);
        }
        continue;
      }
      if (block.body === null) continue; // stray declaration or statement
      const selectors = splitTop(prelude, ',').map((s) => s.trim()).filter(Boolean);
      for (const sel of selectors) {
        if (FORBIDDEN_IN_SELECTOR.test(sel)) {
          report(block.offset, 'global-selector', `"${sel}" targets :root, html or body.`, sel);
        } else if (!inScopedRule && !scopedStart.test(sel)) {
          report(block.offset, 'unscoped-selector', `"${sel}" is not scoped by "${tagPrefix}". Start every selector with a ${tagPrefix}* tag.`, sel);
        }
      }
      // Declarations of this rule, then rules nested inside it (CSS nesting).
      const nested = readBlocks(block.body, block.bodyOffset);
      for (const b of nested) {
        if (b.body === null) checkDeclarations(b.prelude, b.offset);
        else checkRules(`${b.prelude}{${b.body}}`, b.offset, true);
      }
    }
  };

  checkRules(css, 0, false);
  violations.sort((a, b) => a.line - b.line);
  return { ok: violations.length === 0, violations };
}

function parseArgs(argv) {
  const out = { files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prefix') out.prefix = argv[++i];
    else if (a === '--manifest') out.manifest = argv[++i];
    else if (a === '--tokens') out.tokens = argv[++i];
    else if (a === '-h' || a === '--help') out.help = true;
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else out.files.push(a);
  }
  return out;
}

const USAGE = `Usage: check-plugin-css (--prefix acme- | --manifest microcks-plugin.json) [--tokens tokens.json|tokens.css] <file.css...>`;

export function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
    if (args.help) {
      console.log(USAGE);
      return 0;
    }
    let prefix = args.prefix;
    if (!prefix && args.manifest) prefix = JSON.parse(readFileSync(args.manifest, 'utf8')).frontend?.tagPrefix;
    if (!prefix) throw new Error('Give --prefix or a --manifest that has frontend.tagPrefix.');
    if (args.files.length === 0) throw new Error('Name at least one CSS file.');
    const tokensFile = args.tokens ?? DEFAULT_TOKENS;
    if (!existsSync(tokensFile)) throw new Error(`Token list not found: ${tokensFile} (use --tokens).`);
    const tokenNames = loadTokenNames(tokensFile);
    let failed = 0;
    for (const file of args.files) {
      const { violations } = checkPluginCss(readFileSync(file, 'utf8'), prefix, { tokenNames });
      for (const v of violations) console.log(`${file}:${v.line}: ${v.code}: ${v.message}`);
      failed += violations.length;
    }
    if (failed > 0) {
      console.log(`\n${failed} violation${failed === 1 ? '' : 's'}`);
      return 1;
    }
    console.log(`ok: ${args.files.length} file${args.files.length === 1 ? '' : 's'} scoped by ${prefix}`);
    return 0;
  } catch (e) {
    console.error(`error: ${e.message}\n${USAGE}`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
