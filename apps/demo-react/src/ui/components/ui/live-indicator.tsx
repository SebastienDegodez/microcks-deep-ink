// Deep Ink · live-indicator@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';

export interface LiveIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
  /** The stream is paused: the dot stops and "paused" is written next to the label. */
  paused?: boolean;
}

/**
 * Marks a real-time stream. Not a status and not a live region: announce stream changes elsewhere,
 * and pair it with a Pause control.
 */
export function LiveIndicator({ label = 'live', paused, className, ...rest }: LiveIndicatorProps) {
  return (
    <span {...rest} className={['live', className].filter(Boolean).join(' ')} data-paused={paused ? '' : undefined}>
      <span className="live-dot" aria-hidden="true" />
      {label}
      {paused ? <span className="live-paused"> · paused</span> : null}
    </span>
  );
}
