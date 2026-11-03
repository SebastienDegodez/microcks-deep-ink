// Minimal unified diff (LCS on lines). Files are small, so O(n*m) is fine.
export function unifiedDiff(aText, bText, aName, bName, context = 3) {
  const a = aText.split('\n');
  const b = bText.split('\n');
  const n = a.length;
  const m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const ops = []; // [' ' | '-' | '+', line]
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push([' ', a[i]]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) ops.push(['-', a[i++]]);
    else ops.push(['+', b[j++]]);
  }
  while (i < n) ops.push(['-', a[i++]]);
  while (j < m) ops.push(['+', b[j++]]);
  if (!ops.some(([t]) => t !== ' ')) return '';

  const out = [`--- ${aName}`, `+++ ${bName}`];
  const changed = ops.map(([t], k) => (t !== ' ' ? k : -1)).filter((k) => k >= 0);
  let k = 0;
  while (k < changed.length) {
    let start = Math.max(0, changed[k] - context);
    let end = Math.min(ops.length, changed[k] + context + 1);
    let last = k;
    while (last + 1 < changed.length && changed[last + 1] - context <= end) {
      last++;
      end = Math.min(ops.length, changed[last] + context + 1);
    }
    let aStart = 1;
    let bStart = 1;
    for (let x = 0; x < start; x++) {
      if (ops[x][0] !== '+') aStart++;
      if (ops[x][0] !== '-') bStart++;
    }
    const slice = ops.slice(start, end);
    const aLen = slice.filter(([t]) => t !== '+').length;
    const bLen = slice.filter(([t]) => t !== '-').length;
    out.push(`@@ -${aStart},${aLen} +${bStart},${bLen} @@`);
    for (const [t, line] of slice) out.push(t + line);
    k = last + 1;
  }
  return out.join('\n');
}
