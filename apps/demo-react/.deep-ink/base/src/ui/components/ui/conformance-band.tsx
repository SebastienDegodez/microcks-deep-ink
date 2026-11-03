// Deep Ink · conformance-band@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';

export type OperationResult = 'pass' | 'fail' | 'untested';

export interface ConformanceBandProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** One entry per operation. */
  outcomes: OperationResult[];
  /** `full` adds the visible score and counts; `mini` is the catalogue-row version. */
  size?: 'full' | 'mini';
}

/** "11 of 12 operations pass, 1 fails" */
export function conformanceLabel(outcomes: OperationResult[]): string {
  const total = outcomes.length;
  if (total === 0) return 'No operations';
  const pass = outcomes.filter((o) => o === 'pass').length;
  const fail = outcomes.filter((o) => o === 'fail').length;
  const untested = total - pass - fail;
  const parts = [`${pass} of ${total} operation${total === 1 ? '' : 's'} pass`];
  if (fail) parts.push(`${fail} ${fail === 1 ? 'fails' : 'fail'}`);
  if (untested) parts.push(`${untested} untested`);
  return parts.join(', ');
}

export function ConformanceBand({ outcomes, size = 'full', className, ...rest }: ConformanceBandProps) {
  const label = conformanceLabel(outcomes);
  const pass = outcomes.filter((o) => o === 'pass').length;
  const score = outcomes.length ? Math.round((pass / outcomes.length) * 100) : 0;
  const level = score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low';
  const band = (
    <div {...rest} className={['conformance', className].filter(Boolean).join(' ')} data-size={size} role="img" aria-label={label}>
      {outcomes.map((result, i) => (
        <span key={i} data-result={result} />
      ))}
    </div>
  );
  if (size === 'mini') return band;
  return (
    <div className="conformance-wrap">
      {band}
      {/* Visible summary, outside the role="img" so assistive technology reads it as text too. */}
      <p className="conformance-summary">
        <span className="conformance-score" data-level={level}>
          {score}%
        </span>
        <span>{label}</span>
      </p>
    </div>
  );
}
