export type OperationResult = 'pass' | 'fail' | 'untested';

/** "11 of 12 operations pass, 1 fails" */
export function conformanceLabel(outcomes: OperationResult[], unit = 'operation'): string {
  const total = outcomes.length;
  if (total === 0) return `No ${unit}s`;
  const pass = outcomes.filter((o) => o === 'pass').length;
  const fail = outcomes.filter((o) => o === 'fail').length;
  const untested = total - pass - fail;
  const parts = [`${pass} of ${total} ${unit}${total === 1 ? '' : 's'} pass`];
  if (fail) parts.push(`${fail} ${fail === 1 ? 'fails' : 'fail'}`);
  if (untested) parts.push(`${untested} untested`);
  return parts.join(', ');
}
