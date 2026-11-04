import type { HTMLAttributes } from 'react';
import { Icon } from './icon';

export interface LiveIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
  /** The stream is paused: a pause glyph replaces the dot and "paused" is written. */
  paused?: boolean;
  /** Text shown while paused, instead of "<label> · paused": "paused · 2 new calls". Write the word "paused". */
  pausedLabel?: string;
  /** `sm`: 11px, padding 2px 8px. */
  size?: 'md' | 'sm';
  /** `inline`: no pill border, for KPI cards. */
  variant?: 'pill' | 'inline';
}

/**
 * Marks a real-time stream. Not a status and not a live region: announce stream changes elsewhere,
 * and pair it with a Pause control.
 */
export function LiveIndicator({ label = 'live', paused, pausedLabel, size = 'md', variant = 'pill', className, ...rest }: LiveIndicatorProps) {
  return (
    <span
      {...rest}
      className={['live', className].filter(Boolean).join(' ')}
      data-paused={paused ? '' : undefined}
      data-size={size}
      data-variant={variant}
    >
      {paused ? <Icon name="pause" size={10} /> : <span className="live-dot" aria-hidden="true" />}
      {paused && pausedLabel ? (
        pausedLabel
      ) : (
        <>
          {label}
          {paused ? <span className="live-paused"> · paused</span> : null}
        </>
      )}
    </span>
  );
}
