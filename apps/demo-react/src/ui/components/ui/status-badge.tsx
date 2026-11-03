// Deep Ink · status-badge@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';
import { Icon } from './icon';

export type Outcome = 'conformant' | 'failed' | 'partial' | 'running' | 'never';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: Outcome;
  /** Overrides the default word. The word is always rendered. */
  label?: string;
  size?: 'md' | 'sm';
}

const MAP = {
  conformant: { icon: 'check', word: 'Conformant' },
  failed: { icon: 'cross', word: 'Failed' },
  partial: { icon: 'warning', word: 'Partial' },
  running: { icon: 'running', word: 'Running' },
  never: { icon: 'circle', word: 'Never tested' },
} as const;

/** Icon + word + color. The word is never optional. */
export function StatusBadge({ status, label, size = 'md', className, ...rest }: StatusBadgeProps) {
  const s = MAP[status] ?? MAP.never;
  return (
    <span {...rest} className={['di-status', className].filter(Boolean).join(' ')} data-status={status} data-size={size}>
      <Icon name={s.icon} size={size === 'sm' ? 14 : 16} />
      <span>{label ?? s.word}</span>
    </span>
  );
}
