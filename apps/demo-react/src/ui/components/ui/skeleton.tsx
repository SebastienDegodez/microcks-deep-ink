// Deep Ink · skeleton@0.2.0 · copied from packages/registry. You own this file.
import type { CSSProperties, HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Number of text-like lines. */
  lines?: number;
  width?: string | number;
}

/**
 * Decorative placeholder. It is hidden from assistive technology: set aria-busy="true" on the
 * container that is loading and announce completion with a live region.
 */
export function Skeleton({ lines = 1, width, className, style, ...rest }: SkeletonProps) {
  const vars = (width !== undefined ? { '--di-skeleton-width': typeof width === 'number' ? `${width}px` : width } : {}) as CSSProperties;
  if (lines <= 1) {
    return <span {...rest} aria-hidden="true" className={['di-skeleton', className].filter(Boolean).join(' ')} style={{ ...vars, ...style }} />;
  }
  return (
    <span {...rest} aria-hidden="true" className={['di-skeleton-group', className].filter(Boolean).join(' ')} style={{ ...vars, ...style }}>
      {Array.from({ length: lines }, (_, i) => (
        <span className="di-skeleton" key={i} />
      ))}
    </span>
  );
}
