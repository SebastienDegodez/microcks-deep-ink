// Deep Ink · run-progress@0.2.0 · copied from packages/registry. You own this file.
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { Icon } from './icon';

export type RunSegment = 'done' | 'failed' | 'warn' | 'current' | 'queued';
export interface RunCount {
  kind: 'pass' | 'fail' | 'warn' | 'pending';
  /** "4 passed" */
  text: string;
}

export interface RunProgressProps extends HTMLAttributes<HTMLElement> {
  /** Accessible name of the section. */
  label?: string;
  done: number;
  total: number;
  /** "test steps done", "matrix cells filled". */
  caption: string;
  /** "Now calling", "Now checking". */
  nowLabel?: string;
  /** What runs now: "PATCH /pastries/{name}". Announced politely when it changes. */
  now?: string;
  /** One entry per step, in order. */
  segments: RunSegment[];
  counts?: RunCount[];
  /** A control at the end of the counts row ("Step forward"). */
  action?: ReactNode;
  note?: ReactNode;
  /** Gap between segments in px (4 by default, 3 for dense matrices). */
  gap?: number;
}

const COUNT_ICON = { pass: 'check', fail: 'cross', warn: 'warning', pending: 'circle' } as const;

/** Progress of a running test: the count done, what runs now, one segment per step, the counts by result. */
export function RunProgress({ label = 'Progress', done, total, caption, nowLabel, now, segments, counts, action, note, gap, className, style, ...rest }: RunProgressProps) {
  const summary = `${done} of ${total} ${caption}`;
  return (
    <section {...rest} aria-label={label} className={['run-progress', className].filter(Boolean).join(' ')} style={gap !== undefined ? ({ ...style, '--run-gap': `${gap}px` } as CSSProperties) : style}>
      <div className="run-progress-top">
        <p className="run-progress-count">
          <span className="run-progress-done">
            {done}
            <span className="run-progress-total">/{total}</span>
          </span>
          <span className="run-progress-caption">{caption}</span>
        </p>
        {now !== undefined ? (
          <div className="run-progress-now" aria-live="polite">
            {nowLabel ? <span className="run-progress-now-label">{nowLabel}</span> : null}
            <span className="run-progress-now-value">{now}</span>
          </div>
        ) : null}
      </div>
      <div className="run-progress-bar" role="img" aria-label={summary}>
        {segments.map((s, i) => (
          <span key={i} data-seg={s} />
        ))}
      </div>
      {/* The note comes before the foot in the DOM, so the reason is read before the step control; CSS shows it last. */}
      {note ? <p className="run-progress-note">{note}</p> : null}
      {counts?.length || action ? (
        <div className="run-progress-foot">
          {counts?.length ? (
            <ul className="run-progress-counts">
              {counts.map((c) => (
                <li key={c.kind + c.text} data-kind={c.kind}>
                  <Icon name={COUNT_ICON[c.kind]} size={13} />
                  {c.text}
                </li>
              ))}
            </ul>
          ) : null}
          {action ? <span className="run-progress-action">{action}</span> : null}
        </div>
      ) : null}
    </section>
  );
}
