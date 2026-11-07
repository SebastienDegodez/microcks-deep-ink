// Inline style of a root that sets CSS variables from props, serialised as React's `{ ...vars, ...style }`.

/**
 * The declarations of a style string, split on the `;` that end them: a `;` inside quotes, parentheses (`url(...)`)
 * or escaped is part of the value. Each declaration is returned verbatim.
 */
export function declarations(css: string): string[] {
  const out: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: string | undefined;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '\\') i++;
    else if (quote) {
      if (c === quote) quote = undefined;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ';' && depth === 0) {
      out.push(css.slice(start, i));
      start = i + 1;
    }
  }
  out.push(css.slice(start));
  return out.map((d) => d.trim()).filter(Boolean);
}

/**
 * The variables (falsy values skipped) then the `style` string declarations; a declaration of `style` replaces the one
 * of the same name in place, as an object spread does in React (`--split-gap:24px` + `--split-gap: 8px; color: red`
 * -> `--split-gap:8px;color:red`). Values are kept verbatim. `undefined` when empty.
 */
export function withVars(vars: Record<string, string | false | undefined>, style?: string | null): string | undefined {
  const decls = new Map<string, string>();
  for (const [name, v] of Object.entries(vars)) if (v) decls.set(name, `${name}:${v}`);
  for (const d of declarations(style ?? '')) {
    const i = d.indexOf(':');
    const name = i > 0 ? d.slice(0, i).trim() : d;
    decls.set(name.startsWith('--') ? name : name.toLowerCase(), i > 0 ? `${name}:${d.slice(i + 1).trim()}` : d);
  }
  return [...decls.values()].join(';') || undefined;
}
