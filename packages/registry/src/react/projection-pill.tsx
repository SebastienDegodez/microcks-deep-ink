import type { HTMLAttributes } from 'react';

export interface ProjectionPillProps extends HTMLAttributes<HTMLSpanElement> {
  /** Supplementary tooltip ("A2A support is a proposed protocol module for Microcks v2"). The text must stand alone. */
  title?: string;
}

/** Marks a projection: a proposed feature, not available today. Defaults to "Projection · v2 module". */
export function ProjectionPill({ className, children = 'Projection · v2 module', ...rest }: ProjectionPillProps) {
  return (
    <span {...rest} className={['projection-pill', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
