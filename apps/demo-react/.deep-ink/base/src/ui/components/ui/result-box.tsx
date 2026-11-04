// Deep Ink · result-box@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './icon';

export type ResultBoxTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONE_ICON: Record<ResultBoxTone, IconName | undefined> = {
  success: 'check',
  warning: 'warning',
  danger: 'x-circle',
  neutral: 'warning',
  info: undefined,
};

export interface ResultBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  /** `success` (default), `warning`, `danger`, `neutral` (thin frame on --bg), `info` (strong frame on --raised). */
  tone?: ResultBoxTone;
  /** `md`: 14px text in --text (toast). Default 13px in --text-secondary. */
  size?: 'sm' | 'md';
  /** Bold 14px first line. */
  title?: ReactNode;
  /** Leading decorative icon. Defaults to the tone's icon; `null` hides it. */
  icon?: IconName | null;
  /** Buttons or links at the end ("Undo", "Link source"). */
  action?: ReactNode;
  /** Shows a 28px dismiss button. */
  onDismiss?: () => void;
  dismissLabel?: string;
  /** `status` (default) is a polite live region; `off` for static content. */
  live?: 'status' | 'off';
  /** Default `true`. `false`: no frame, a top-aligned note layout (gap 10, 15px icon offset 3px with a 2.6 stroke, title in normal line height, 13px/1.55 text up to 80ch), as the Agent test verdict. */
  bordered?: boolean;
  /** Default `surface`. `raised`: the --raised fill instead of --surface (Agent test verdict). */
  surface?: 'surface' | 'raised';
}

/** A framed result line in a `role="status"` box. Keep it mounted before the result arrives. */
export function ResultBox({
  tone = 'success',
  size = 'sm',
  title,
  icon,
  action,
  onDismiss,
  dismissLabel = 'Dismiss message',
  live = 'status',
  bordered = true,
  surface = 'surface',
  className,
  children,
  ...rest
}: ResultBoxProps) {
  const name = icon === null ? undefined : (icon ?? TONE_ICON[tone]);
  return (
    <div
      {...rest}
      role={live === 'status' ? 'status' : undefined}
      className={['result-box', className].filter(Boolean).join(' ')}
      data-tone={tone === 'success' ? undefined : tone}
      data-size={size === 'md' ? 'md' : undefined}
      data-bordered={bordered ? undefined : 'false'}
      data-surface={surface === 'surface' ? undefined : surface}
    >
      {name ? (
        <span className="result-box-icon" aria-hidden="true">
          <Icon name={name} size={15} />
        </span>
      ) : null}
      <div className="result-box-body">
        {title ? <p className="result-box-title">{title}</p> : null}
        {children ? <span>{children}</span> : null}
      </div>
      {action ? <span className="result-box-action">{action}</span> : null}
      {onDismiss ? (
        <button type="button" className="result-box-dismiss" aria-label={dismissLabel} onClick={onDismiss}>
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </div>
  );
}
