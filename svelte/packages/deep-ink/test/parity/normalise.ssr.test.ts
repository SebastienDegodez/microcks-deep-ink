import { describe, expect, it } from 'vitest';
import { normaliseHtml as n } from './normalise';

describe('normaliseHtml', () => {
  it('sorts attributes and ignores quoting, boolean spelling, void element closing and entities', () => {
    expect(n(`<input type='text' disabled="" id="a"/>`)).toBe(n('<input disabled id="a" type="text">'));
    expect(n('<p title="a&quot;b">x &amp; y</p>')).toBe(n(`<p title='a"b'>x &#38; y</p>`));
  });

  it('ignores whitespace between and inside text nodes, and comments', () => {
    expect(n('<ul>\n  <li> a   b </li>\n  <li>c</li>\n</ul>')).toBe(n('<ul><!--[--><li>a b</li><li>c</li><!--]--></ul>'));
    expect(n('<b>Ctrl<!----> K</b>')).toBe(n('<b>Ctrl K</b>'));
  });

  it('keeps whitespace inside <pre> and <textarea>', () => {
    expect(n('<pre>a\n  b</pre>')).not.toBe(n('<pre>a b</pre>'));
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

  it('prints one node per line, indented', () => {
    expect(n('<p class="x">a<b>b</b></p>')).toBe('<p class="x">\n  a\n  <b>\n    b\n  </b>\n</p>');
  });
});
