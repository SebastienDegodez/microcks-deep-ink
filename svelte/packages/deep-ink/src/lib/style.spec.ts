import { describe, expect, it } from 'vitest';
import { declarations, withVars } from './style';

describe('withVars', () => {
  it('keeps a quoted semicolon in the value', () => {
    expect(withVars({ '--a': '1px' }, 'content: "a;b"; color: red')).toBe('--a:1px;content:"a;b";color:red');
    expect(declarations("content: 'x;y\\'z'; top: 0")).toEqual(["content: 'x;y\\'z'", 'top: 0']);
  });

  it('keeps a data URL with semicolons', () => {
    const bg = 'background:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'/>")';
    expect(withVars({ '--a': '1px' }, `${bg};color:red`)).toBe(`--a:1px;${bg};color:red`);
  });

  it('keeps an unquoted url() holding ; and an escaped )', () => {
    const bg = 'background-image:url(data:image/png;base64,AAA\\)B;C)';
    expect(withVars({}, `${bg}; margin: 0`)).toBe(`${bg};margin:0`);
  });

  it('keeps !important', () => {
    expect(withVars({ '--split-gap': '24px' }, '--split-gap: 8px !important')).toBe('--split-gap:8px !important');
  });

  it('reads the string with or without a trailing semicolon, and an empty one', () => {
    expect(withVars({}, 'color: red;')).toBe('color:red');
    expect(withVars({}, 'color: red')).toBe('color:red');
    expect(withVars({ '--a': undefined, '--b': false }, ' ; ')).toBeUndefined();
  });

  it('overrides a variable in place, as a React object spread', () => {
    expect(withVars({ '--split-side': '300px', '--split-gap': '24px' }, '--split-gap: 8px; color: red; COLOR: blue')).toBe(
      '--split-side:300px;--split-gap:8px;COLOR:blue',
    );
  });
});
