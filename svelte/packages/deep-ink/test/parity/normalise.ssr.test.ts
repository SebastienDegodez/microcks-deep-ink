import { describe, expect, it } from 'vitest';
import { normaliseHtml as n } from './normalise';

describe('normaliseHtml', () => {
  it('sorts attributes and ignores quoting, boolean spelling, void element closing and entities', () => {
    expect(n(`<input type='text' disabled="" id="a"/>`)).toBe(n('<input disabled id="a" type="text">'));
    expect(n('<p title="a&quot;b">x &amp; y</p>')).toBe(n(`<p title='a"b'>x &#38; y</p>`));
  });

  it('ignores comments, and the formatting whitespace between and at the edges of blocks', () => {
    expect(n('<ul>\n  <li> a   b </li>\n  <li>c</li>\n</ul>')).toBe(n('<ul><!--[--><li>a b</li><li>c</li><!--]--></ul>'));
    expect(n('<b>Ctrl<!----> K</b>')).toBe(n('<b>Ctrl K</b>'));
    expect(n('<div>\n  <p>a</p>\n  <p>b</p>\n</div>\n')).toBe(n('<div><p>a</p><p>b</p></div>'));
    expect(n('<p>a<br>\n  b</p>')).toBe(n('<p>a<br>b</p>'));
    expect(n('<button>\n  <span>Go</span>\n</button>')).toBe(n('<button><span>Go</span></button>'));
  });

  it('collapses runs of whitespace to one space, also across inline elements', () => {
    expect(n('<span>a  \n\t b</span>')).toBe(n('<span>a b</span>'));
    expect(n('<p>a <b> b</b></p>')).toBe(n('<p>a <b>b</b></p>'));
    expect(n('<span>a&nbsp; b</span>')).not.toBe(n('<span>a b</span>'));
  });

  it('keeps a space vs no space inside text and between inline siblings', () => {
    expect(n('<span>a b</span>')).not.toBe(n('<span>ab</span>'));
    expect(n('<div><span>a</span> <span>b</span></div>')).not.toBe(n('<div><span>a</span><span>b</span></div>'));
    expect(n('<div><label>a</label>\n  <span>b</span></div>')).not.toBe(n('<div><label>a</label><span>b</span></div>'));
    expect(n('<p>a <button>b</button></p>')).not.toBe(n('<p>a<button>b</button></p>'));
    expect(n('<p>x<span> a</span></p>')).not.toBe(n('<p>x<span>a</span></p>'));
  });

  it('keeps whitespace inside <pre>, <code> and <textarea> exactly', () => {
    expect(n('<pre>a\n  b</pre>')).not.toBe(n('<pre>a b</pre>'));
    expect(n('<p><code>a  b</code></p>')).not.toBe(n('<p><code>a b</code></p>'));
    expect(n('<p><code> a</code></p>')).not.toBe(n('<p><code>a</code></p>'));
    expect(n('<textarea>a\n</textarea>')).not.toBe(n('<textarea>a</textarea>'));
    expect(n('<pre>a\n  b</pre>')).toBe('<pre>\n  "a\\n  b"\n</pre>');
  });

  it('ignores class token order and duplicates, empty class and style, and style spacing', () => {
    expect(n('<span class="b  a a" style="color: red; width :1px;">x</span>')).toBe(n('<span style="color:red;width:1px" class="a b">x</span>'));
    expect(n('<span class="" style="">x</span>')).toBe(n('<span>x</span>'));
  });

  it('renames generated ids and their references in order of first appearance', () => {
    const react = '<label for="_r_0_">Name</label><input id="_r_0_" aria-describedby="_r_0_-hint _r_1_"><p id="_r_0_-hint">h</p><a href="#_r_1_">x</a>';
    const svelte = '<label for="s1">Name</label><input aria-describedby="s1-hint s2" id="s1"><p id="s1-hint">h</p><a href="#s2">x</a>';
    expect(n(react)).toBe(n(svelte));
    expect(n(react)).toContain('<input aria-describedby="id-2 id-3" id="id-1">');
  });

  it('still tells real differences apart', () => {
    expect(n('<span class="a">x</span>')).not.toBe(n('<span class="b">x</span>'));
    expect(n('<span>x</span>')).not.toBe(n('<b>x</b>'));
    expect(n('<input disabled>')).not.toBe(n('<input>'));
    expect(n('<a href="/x">x</a>')).not.toBe(n('<a href="/y">x</a>'));
    expect(n('<span>x</span>')).not.toBe(n('<span>y</span>'));
    expect(n('<label for="a"></label><input id="b">')).not.toBe(n('<label for="a"></label><input id="a">'));
  });

  it('prints one node per line, indented, text quoted', () => {
    expect(n('<p class="x">a<b>b</b></p>')).toBe('<p class="x">\n  "a"\n  <b>\n    "b"\n  </b>\n</p>');
  });
});
