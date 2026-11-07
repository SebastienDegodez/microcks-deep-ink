// Inline style of a root that sets CSS variables from props, serialised as React's `{ ...vars, ...style }`.

/**
 * The variables (falsy values skipped) then the `style` string declarations; a declaration of `style` replaces the one
 * of the same name in place, as an object spread does in React (`--split-gap:24px` + `--split-gap: 8px; color: red`
 * -> `--split-gap:8px;color:red`). `undefined` when empty.
 */
export function withVars(vars: Record<string, string | false | undefined>, style?: string | null): string | undefined {
  const decls = new Map<string, string>();
  for (const [name, v] of Object.entries(vars)) if (v) decls.set(name, v);
  for (const d of (style ?? '').split(';')) {
    const i = d.indexOf(':');
    if (i > 0) decls.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
  }
  return [...decls].map(([name, v]) => `${name}:${v}`).join(';') || undefined;
}
