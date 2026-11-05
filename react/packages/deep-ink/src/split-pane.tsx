import type { CSSProperties, ElementType, HTMLAttributes } from 'react';

export interface SplitPaneProps extends HTMLAttributes<HTMLDivElement> {
  /** Starting width of the side pane (260px). */
  sideWidth?: string;
  /** Cap of the side pane (360px); `none` lets it grow. */
  sideMax?: string;
  /** Starting width of the main pane (520px): below side + main + gap, the main pane wraps. */
  mainWidth?: string;
  /** Gap between the panes (20px). */
  gap?: string;
  /** `stretch`: both panes as tall as the taller one. Default `start`. */
  align?: 'start' | 'stretch';
  /** Both panes grow alike instead of the main pane taking the rest (Sources). */
  balanced?: boolean;
  /** Keep the `sideMax` cap below 720px too, instead of letting the side pane fill the row (Service rail, Copilot side). */
  keepSideMax?: boolean;
}

export interface SplitPanePaneProps extends HTMLAttributes<HTMLElement> {
  /** Element of the pane: `section`, `aside`, `nav` (name the landmark) or `div` (default). */
  as?: 'div' | 'section' | 'aside' | 'nav' | 'ul' | 'ol';
}

/** List + detail layout. Children: a `SplitPaneSide` and a `SplitPaneMain`, in reading order. */
export function SplitPane({ sideWidth, sideMax, mainWidth, gap, align = 'start', balanced, keepSideMax, className, style, ...rest }: SplitPaneProps) {
  const vars: Record<string, string> = {};
  if (sideWidth) vars['--split-side'] = sideWidth;
  if (sideMax) vars['--split-side-max'] = sideMax;
  if (mainWidth) vars['--split-main'] = mainWidth;
  if (gap) vars['--split-gap'] = gap;
  return (
    <div
      {...rest}
      className={['split-pane', className].filter(Boolean).join(' ')}
      data-align={align === 'stretch' ? 'stretch' : undefined}
      data-balanced={balanced ? '' : undefined}
      data-keep-side-max={keepSideMax ? '' : undefined}
      style={{ ...(vars as CSSProperties), ...style }}
    />
  );
}

/** The narrow pane (list, rail, filters). */
export function SplitPaneSide({ as = 'div', className, ...rest }: SplitPanePaneProps) {
  const Tag = as as ElementType;
  return <Tag {...rest} className={['split-pane-side', className].filter(Boolean).join(' ')} />;
}

/** The wide pane (detail). */
export function SplitPaneMain({ as = 'div', className, ...rest }: SplitPanePaneProps) {
  const Tag = as as ElementType;
  return <Tag {...rest} className={['split-pane-main', className].filter(Boolean).join(' ')} />;
}
