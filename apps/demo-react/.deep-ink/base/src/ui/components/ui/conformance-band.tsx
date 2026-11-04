// Deep Ink · conformance-band@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';
import { Icon } from './icon';

export type OperationResult = 'pass' | 'fail' | 'untested';

export interface ConformanceBandProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** One entry per operation. */
  outcomes: OperationResult[];
  /** `full`: 12px cells; `mini`: the 96 x 14 catalogue-row band. */
  size?: 'full' | 'mini';
  /** One visible label per cell, written under it ("GET /pastries · passed"). Full size only. */
  labels?: string[];
  /** Adds the 40px score and the counts as text under the band. Full size only. */
  showSummary?: boolean;
  /** What a segment counts, singular: `operation` (default) or `skill` for an A2A agent. */
  unit?: string;
}

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

const RESULT_ICON = { pass: 'check', fail: 'cross', untested: 'circle' } as const;

export function ConformanceBand({ outcomes, size = 'full', unit = 'operation', labels, showSummary, className, ...rest }: ConformanceBandProps) {
  const label = conformanceLabel(outcomes, unit);
  const pass = outcomes.filter((o) => o === 'pass').length;
  const score = outcomes.length ? Math.round((pass / outcomes.length) * 100) : 0;
  const level = score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low';
  const cls = ['conformance', className].filter(Boolean).join(' ');
  if (size === 'mini' || !labels) {
    const band = (
      <div {...rest} className={cls} data-size={size} role="img" aria-label={label}>
        {outcomes.map((result, i) => (
          <span key={i} data-result={result} />
        ))}
      </div>
    );
    if (size === 'mini' || !showSummary) return band;
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
  // Labelled: the labels are text, so the band is a list named by the counts, not an image.
  const list = (
    <ul {...(rest as HTMLAttributes<HTMLUListElement>)} className={cls} data-size={size} data-labelled="" aria-label={label}>
      {outcomes.map((result, i) => (
        <li key={i} data-result={result}>
          <span className="conformance-bar" aria-hidden="true" />
          <span className="conformance-label">
            <Icon name={RESULT_ICON[result]} size={12}/>
            {labels[i]}
          </span>
        </li>
      ))}
    </ul>
  );
  if (!showSummary) return list;
  return (
    <div className="conformance-wrap">
      {list}
      <p className="conformance-summary">
        <span className="conformance-score" data-level={level}>
          {score}%
        </span>
        <span>{label}</span>
      </p>
    </div>
  );
}
