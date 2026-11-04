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
  className?: string;
}

/**
 * Filter buttons that behave like one choice (All / Passed / Failed). A `role="group"` of
 * buttons with `aria-pressed`. Announce the result count of the filtered list in a live region.
 */
export function Segmented({ label, options, value, onChange, variant = 'track', tone = 'neutral', className }: SegmentedProps) {
  return (
    <div role="group" aria-label={label} className={['segmented', className].filter(Boolean).join(' ')} data-variant={variant} data-tone={tone}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.dot ? <span className="segmented-dot" data-dot={o.dot} aria-hidden="true" /> : null}
          {o.icon ? <Icon name={o.icon} size={15} /> : null}
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
