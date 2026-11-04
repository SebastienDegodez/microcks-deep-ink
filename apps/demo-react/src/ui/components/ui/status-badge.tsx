// Deep Ink · status-badge@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';
import { Icon, type IconName } from './icon';

export type Outcome = 'conformant' | 'failed' | 'partial' | 'running' | 'never';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: Outcome;
  /** Overrides the default word. The word is always rendered. */
  label?: string;
  size?: 'md' | 'sm';
  /**
   * `circled` (default): ringed icons for a summary (last test, last run); "never" is a dashed ring.
   * `bare`: plain check and cross for step and test outcomes.
   */
  shape?: 'circled' | 'bare';
}

const WORD: Record<Outcome, string> = {
  conformant: 'Conformant',
  failed: 'Failed',
  partial: 'Partial',
  running: 'Running',
  never: 'Never tested',
};

const ICON: Record<'circled' | 'bare', Record<Outcome, IconName>> = {
  circled: { conformant: 'check-circle', failed: 'x-circle', partial: 'warning', running: 'running', never: 'never-tested' },
  bare: { conformant: 'check', failed: 'cross', partial: 'warning', running: 'running', never: 'circle' },
};

/** Icon + word + color. The word is never optional. */
export function StatusBadge({ status, label, size = 'md', shape = 'circled', className, ...rest }: StatusBadgeProps) {
  const known = status in WORD ? status : 'never';
  const iconSize = shape === 'circled' ? (size === 'sm' ? 14 : 15) : size === 'sm' ? 13 : 14;
  return (
    <span {...rest} className={['status', className].filter(Boolean).join(' ')} data-status={status} data-size={size} data-shape={shape}>
      <Icon name={ICON[shape][known]} size={iconSize} />
      <span>{label ?? WORD[known]}</span>
    </span>
  );
}
