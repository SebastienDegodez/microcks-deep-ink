// Canonical form of an HTML fragment, so that the markup of the React and the Svelte flavours can be compared.
// Parsed with jsdom, then printed one node per line. Ignored differences:
//   - attribute order (sorted), quoting, `disabled` vs `disabled=""`, `<input/>` vs `<input>`, entity spelling;
//   - class token order and duplicates, empty class/style attributes, spacing inside style declarations;
//   - comments (Svelte's hydration markers) and whitespace: text is trimmed and collapsed, blank text dropped
//     (except inside <pre> and <textarea>);
//   - generated ids: every id, and every id reference (for, aria-labelledby, aria-controls..., href="#..."), is
//     renamed id-1, id-2... in order of first appearance.
import { JSDOM } from 'jsdom';

const IDREFS = new Set([
  'aria-activedescendant', 'aria-controls', 'aria-describedby', 'aria-details', 'aria-errormessage', 'aria-flowto',
  'aria-labelledby', 'aria-owns', 'anchor', 'commandfor', 'for', 'form', 'headers', 'id', 'list', 'popovertarget',
]);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['pre', 'textarea']);

let window: JSDOM['window'] | undefined;
const escape = (s: string, attr = false) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, '&nbsp;').replace(attr ? /"/g : /$^/, '&quot;');

export function normaliseHtml(html: string): string {
  window ??= new JSDOM('').window;
  const template = window.document.createElement('template');
  template.innerHTML = html;
  const ids = new Map<string, string>();
  const id = (v: string) => ids.get(v) ?? (ids.set(v, `id-${ids.size + 1}`), `id-${ids.size}`);

  const value = (name: string, v: string): string | undefined => {
    if (name === 'class') return v.split(/\s+/).filter(Boolean).sort().filter((c, i, a) => c !== a[i - 1]).join(' ') || undefined;
    if (name === 'style')
      return v.split(';').map((d) => d.trim().replace(/\s*:\s*/, ':').replace(/\s+/g, ' ')).filter(Boolean).join(';') || undefined;
    if (IDREFS.has(name)) return v.split(/\s+/).filter(Boolean).map(id).join(' ');
    if (name === 'href' && v.startsWith('#') && v.length > 1) return `#${id(v.slice(1))}`;
    return v;
  };

  const lines: string[] = [];
  const walk = (node: Node, depth: number, raw: boolean) => {
    const pad = '  '.repeat(depth);
    if (node.nodeType === 3) {
      const text = raw ? node.textContent! : node.textContent!.replace(/\s+/g, ' ').trim();
      if (text) lines.push(pad + escape(text));
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.localName;
    const attrs = [...el.attributes]
      .map((a) => [a.name, value(a.name, a.value)] as const)
      .filter((a): a is readonly [string, string] => a[1] !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([n, v]) => (v === '' ? ` ${n}` : ` ${n}="${escape(v, true)}"`))
      .join('');
    lines.push(`${pad}<${tag}${attrs}>`);
    if (VOID.has(tag)) return;
    const children = tag === 'template' ? (el as HTMLTemplateElement).content : el;
    children.normalize();
    for (const child of [...children.childNodes]) walk(child, depth + 1, raw || RAW.has(tag));
    lines.push(`${pad}</${tag}>`);
  };
  const root = template.content;
  // Drop comments first so that the text around a Svelte marker merges into one node.
  const comments = window.document.createTreeWalker(root, 128);
  const drop: Node[] = [];
  while (comments.nextNode()) drop.push(comments.currentNode);
  for (const c of drop) c.parentNode!.removeChild(c);
  root.normalize();
  for (const child of [...root.childNodes]) walk(child, 0, false);
  return lines.join('\n');
}
