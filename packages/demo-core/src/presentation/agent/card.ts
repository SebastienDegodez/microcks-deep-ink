/** A token of a JSON line, with the kind that colours it. */
export type Tok = { v: string; k: 'key' | 'colon' | 'str' | 'num' | 'lit' | 'punct' | 'plain' };

/** JSON tokens of one pretty-printed line, coloured like the prototype viewer. */
export function tokenize(line: string): Tok[] {
  const out: Tok[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?)|\b(true|false|null)\b|([{}[\],])|(\s+)/g;
  let last = 0;
  for (let m = re.exec(line); m !== null; m = re.exec(line)) {
    if (m.index > last) out.push({ v: line.slice(last, m.index), k: 'plain' });
    if (m[1] && m[2]) out.push({ v: m[1], k: 'key' }, { v: m[2], k: 'colon' });
    else if (m[1]) out.push({ v: m[1], k: 'str' });
    else if (m[3]) out.push({ v: m[3], k: 'num' });
    else if (m[4]) out.push({ v: m[4], k: 'lit' });
    else if (m[5]) out.push({ v: m[5], k: 'punct' });
    else out.push({ v: m[6] ?? '', k: 'plain' });
    last = re.lastIndex;
  }
  if (last < line.length) out.push({ v: line.slice(last), k: 'plain' });
  return out;
}
