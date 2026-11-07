// Canonical form of an HTML fragment, so that the markup of the React and the Svelte flavours can be compared.
// Parsed with jsdom, then printed one node per line. Ignored differences:
//   - attribute order (sorted), quoting, `disabled` vs `disabled=""`, `<input/>` vs `<input>`, entity spelling;
//   - class token order and duplicates, empty class/style attributes, spacing inside style declarations;
//   - comments (Svelte's hydration markers); text on both sides of a dropped comment merges into one node;
//   - formatting-only whitespace, i.e. whitespace that HTML rendering would not show (rule below);
//   - generated ids: every id, and every id reference (for, aria-labelledby, aria-controls..., href="#..."), is
//     renamed id-1, id-2... in order of first appearance.
//
// Whitespace rule (a tag-based model of CSS `white-space: normal`, so that a space the user would see is compared):
//   1. Inside <pre>, <textarea> and <code> text is kept exactly.
//   2. Elsewhere every run of ASCII whitespace (space, tab, CR, LF, FF; not &nbsp;) becomes one space.
//   3. Text is laid out in inline runs. A block element (BLOCK, plus <br>) ends the current run on entry and on exit;
//      an atomic inline (ATOMIC: button, input, select, textarea, progress, meter, img, svg...) lays its content out
//      in a run of its own and counts as one visible non-space character in the outer run.
//   4. Within a run, a space is dropped at the start of the run, right after another space (across element
//      boundaries: `a <b> b</b>` = `a <b>b</b>`), and at the end of the run. Every other space is kept.
// So indentation between blocks (`<div>\n  <p>`) disappears, while `a b` vs `ab`, or `<span>a</span> <span>b</span>`
// vs `<span>a</span><span>b</span>`, still differ. Text is printed between double quotes so that edge spaces show.
// The model is tag-based: CSS (flex, display) is not known, so a space between two flex items still counts.
import { JSDOM } from 'jsdom';

const IDREFS = new Set([
  'aria-activedescendant', 'aria-controls', 'aria-describedby', 'aria-details', 'aria-errormessage', 'aria-flowto',
  'aria-labelledby', 'aria-owns', 'anchor', 'commandfor', 'for', 'form', 'headers', 'id', 'list', 'popovertarget',
]);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['pre', 'textarea', 'code']);
const BLOCK = new Set([
  'address', 'article', 'aside', 'blockquote', 'br', 'caption', 'dd', 'details', 'dialog', 'div', 'dl', 'dt', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'legend', 'li',
  'main', 'nav', 'ol', 'optgroup', 'option', 'p', 'pre', 'section', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th',
  'thead', 'tr', 'ul',
]);
const ATOMIC = new Set([
  'audio', 'button', 'canvas', 'embed', 'iframe', 'img', 'input', 'meter', 'object', 'progress', 'select', 'svg',
  'template', 'textarea', 'video',
]);
const contents = (el: Element): ParentNode => (el.localName === 'template' ? (el as HTMLTemplateElement).content : el);

/** The rendered text of every text node (rule above); '' for text that renders nothing. */
function layout(root: ParentNode): Map<Node, string> {
  const out = new Map<Node, string>();
  let run: { node?: Node; raw?: boolean }[] = [];
  let space = true;
  const end = () => {
    for (let i = run.length - 1; i >= 0; i--) {
      const { node, raw } = run[i]!;
      if (!node || raw) break;
      const t = out.get(node)!.replace(/ $/, '');
      out.set(node, t);
      if (t) break;
    }
    run = [];
    space = true;
  };
  const visit = (node: Node, raw: boolean) => {
    if (node.nodeType === 3) {
      let t = node.textContent!;
      if (!raw) t = t.replace(/[ \t\n\r\f]+/g, ' ');
      if (!raw && space) t = t.replace(/^ /, '');
      out.set(node, t);
      if (t) {
        run.push({ node, raw });
        space = !raw && t.endsWith(' ');
      }
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.localName;
    const inner = contents(el);
    inner.normalize();
    const children = () => { for (const c of [...inner.childNodes]) visit(c, raw || RAW.has(tag)); };
    if (BLOCK.has(tag)) return end(), children(), end();
    if (!ATOMIC.has(tag)) return children();
    const outer = run;
    run = [];
    space = true;
    children();
    end();
    run = [...outer, {}];
    space = false;
  };
  root.normalize();
  for (const c of [...root.childNodes]) visit(c, false);
  end();
  return out;
}

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
  const walk = (node: Node, depth: number) => {
    const pad = '  '.repeat(depth);
    if (node.nodeType === 3) {
      const t = text.get(node);
      if (t) lines.push(`${pad}"${escape(t).replace(/\n/g, '\\n')}"`);
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
    for (const child of [...contents(el).childNodes]) walk(child, depth + 1);
    lines.push(`${pad}</${tag}>`);
  };
  const root = template.content;
  // Drop comments first so that the text around a Svelte marker merges into one node.
  const comments = window.document.createTreeWalker(root, 128);
  const drop: Node[] = [];
  while (comments.nextNode()) drop.push(comments.currentNode);
  for (const c of drop) c.parentNode!.removeChild(c);
  const text = layout(root);
  for (const child of [...root.childNodes]) walk(child, 0);
  return lines.join('\n');
}
