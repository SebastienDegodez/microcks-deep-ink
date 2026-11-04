// Deep Ink · runner-log@0.2.0 · copied from packages/registry. You own this file.
import { useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

export type RunnerLevel = 'INFO' | 'SEND' | 'PASS' | 'FAIL' | 'WAIT';
export interface RunnerLine {
  time: string;
  level: RunnerLevel;
  text: string;
  /** Written in the main text colour. */
  emphasis?: boolean;
  /** Written in the danger colour. */
  error?: boolean;
}

export interface RunnerLogProps extends HTMLAttributes<HTMLElement> {
  /** Visible heading, also the name of the log. */
  title?: string;
  /** End of the header: `<LiveIndicator variant="inline" label="live · streaming" />` or "12 lines · completed". */
  status?: ReactNode;
  lines: RunnerLine[];
}

/** The runner's log: a `role="log"` list (newest at the bottom, kept in view) under a small heading. */
export function RunnerLog({ title = 'Runner log', status, lines, className, ...rest }: RunnerLogProps) {
  const id = useId();
  return (
    <section {...rest} aria-labelledby={id} className={['runner-log', className].filter(Boolean).join(' ')}>
      <div className="runner-log-head">
        <h2 className="runner-log-title" id={id}>
          {title}
        </h2>
        {status ? <span className="runner-log-status">{status}</span> : null}
      </div>
      {/* The log scrolls, so it must be keyboard reachable (WCAG 2.1.1). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="runner-log-body" role="log" aria-labelledby={id} tabIndex={0}>
        <ol className="runner-log-lines">
          {lines.map((l, i) => (
            <li key={i} className="runner-log-line" data-level={l.level} data-emphasis={l.emphasis ? '' : undefined} data-error={l.error ? '' : undefined}>
              <span className="runner-log-time">{l.time}</span>
              <span className="runner-log-level">{l.level}</span>
              <span className="runner-log-text">{l.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
