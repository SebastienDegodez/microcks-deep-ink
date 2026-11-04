// Deep Ink · section-label@0.2.0 · copied from packages/registry. You own this file.
import type { ElementType, HTMLAttributes, LabelHTMLAttributes } from 'react';

export interface SectionLabelProps extends HTMLAttributes<HTMLElement> {
  /** Element to render: a heading for a section, `label` for a field, `span` (default) for a caption. */
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'span' | 'p' | 'div';
  /** `md` (default): 12px, tracking .04em. `sm`: 11px, tracking .06em. */
  size?: 'md' | 'sm';
  /** `regular`: weight 400 instead of 600. */
  weight?: 'semibold' | 'regular';
  /** Spreads the children to both ends of the line ("3 operations" · "calls · 7 d"). */
  split?: boolean;
  /** `fixed` (default): 16px. `normal`: the font's own line height (Agent test setup strip and detail titles, TestRun score label). `snug`: 1.4 (Agent skills rail head). */
  lineHeight?: 'fixed' | 'normal' | 'snug';
  /** With `as="label"`: id of the field. */
  htmlFor?: LabelHTMLAttributes<HTMLLabelElement>['htmlFor'];
}

/** Small uppercase muted label. The text stays in normal case in the DOM; CSS sets the case. */
export function SectionLabel({ as = 'span', size = 'md', weight = 'semibold', split, lineHeight = 'fixed', className, ...rest }: SectionLabelProps) {
  const Tag = as as ElementType;
  return (
    <Tag
      {...rest}
      className={['section-label', className].filter(Boolean).join(' ')}
      data-size={size === 'md' ? undefined : size}
      data-weight={weight === 'semibold' ? undefined : weight}
      data-split={split ? '' : undefined}
      data-line-height={lineHeight === 'fixed' ? undefined : lineHeight}
    />
  );
}
