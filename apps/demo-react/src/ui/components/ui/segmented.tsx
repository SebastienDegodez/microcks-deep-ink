// Deep Ink · segmented@0.2.0 · copied from packages/registry. You own this file.
import { Icon, type IconName } from './icon';

export type SegmentedDot = 'neutral' | 'success' | 'danger' | 'warning' | 'muted' | 'ring';

export interface SegmentedOption {
  id: string;
  label: string;
  /** Result count, read as "Failed, 2". */
  count?: number;
  /** Leading 8px dot (decorative: the label carries the meaning). `ring` is an empty muted ring. */
  dot?: SegmentedDot;
  /** Leading icon (decorative). */
  icon?: IconName;
  /** Colour of the icon (Sources status filter). The label still carries the meaning. */
  iconTone?: 'success' | 'warning' | 'danger' | 'muted';
}

export interface SegmentedProps {
  /** Accessible name of the group ("Result"). */
  label: string;
  options: SegmentedOption[];
  /** Id of the pressed option. */
  value: string;
  onChange: (id: string) => void;
  /** `track` (default): padded track, the pressed option raised. `joined`: bordered cells side by side. */
  variant?: 'track' | 'joined';
  /** `primary` (joined only): the pressed option is filled with the action colour. */
  tone?: 'neutral' | 'primary';
  /** Track only. Fill of the pressed option: `raised` (default) or `selected` (Sources). */
  pressedFill?: 'raised' | 'selected';
  /** Icon size in px: 15 (default) or 13 (Sources status icons). */
  iconSize?: 13 | 15;
  /** `sm` (joined): 28px, mono 12px 600, no separators (Behavior, Admin, Copilot). */
  size?: 'md' | 'sm';
  /** `wide`: 0 12px button padding instead of 0 10px (Usage period). */
  spacing?: 'normal' | 'wide';
  className?: string;
}

/**
 * Filter buttons that behave like one choice (All / Passed / Failed). A `role="group"` of
 * buttons with `aria-pressed`. Announce the result count of the filtered list in a live region.
 */
export function Segmented({ label, options, value, onChange, variant = 'track', tone = 'neutral', pressedFill = 'raised', iconSize = 15, size = 'md', spacing = 'normal', className }: SegmentedProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={['segmented', className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-tone={tone}
      data-pressed-fill={pressedFill === 'selected' ? 'selected' : undefined}
      data-size={size === 'sm' ? 'sm' : undefined}
      data-spacing={spacing === 'wide' ? 'wide' : undefined}
    >
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.dot ? <span className="segmented-dot" data-dot={o.dot} aria-hidden="true" /> : null}
          {o.icon ? <Icon name={o.icon} size={iconSize} data-tone={o.iconTone} /> : null}
          {o.label}
          {o.count !== undefined ? (
            <span className="segmented-count">
              <span className="sr-only">, </span>
              {o.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
