import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { CopyButton } from './copy-button';

export interface CiPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Names the region ("Run this test in your pipeline"). */
  title: ReactNode;
  /** After the title: an ApiBadge `cli | proposed`, a ProjectionPill. */
  pill?: ReactNode;
  /** 12px muted line under the title. */
  hint?: ReactNode;
  /** The command, copied by the Copy button. It wraps. */
  command: string;
  /** 12px muted note under the command. */
  footnote?: ReactNode;
  /** Dashed frame (a projected, not-yet-available command: AgentTestRun). */
  dashed?: boolean;
  /** Label of the copy button (default "Copy"; "Copy command" on AgentTestRun). */
  copyLabel?: string;
}

/**
 * "Run it from CI" panel. Show it with a `<Button className="ci-panel-toggle" aria-expanded aria-controls={id}>`
 * and give the panel that `id`.
 */
export function CiPanel({ title, pill, hint, command, footnote, dashed, copyLabel = 'Copy', className, ...rest }: CiPanelProps) {
  const titleId = useId();
  return (
    <section {...rest} aria-labelledby={titleId} className={['ci-panel', className].filter(Boolean).join(' ')} data-dashed={dashed ? '' : undefined}>
      <div className="ci-panel-head">
        <div className="ci-panel-text">
          <p className="ci-panel-title">
            <span id={titleId}>{title}</span>
            {pill}
          </p>
          {hint ? <p className="ci-panel-hint">{hint}</p> : null}
        </div>
        <CopyButton value={command} label={copyLabel} variant="outline" size="sm" />
      </div>
      <pre className="ci-panel-code">
        <code>{command}</code>
      </pre>
      {footnote ? <p className="ci-panel-foot">{footnote}</p> : null}
    </section>
  );
}
