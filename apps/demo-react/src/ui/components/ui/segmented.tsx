// Deep Ink · segmented@0.2.0 · copied from packages/registry. You own this file.
export interface SegmentedOption {
  id: string;
  label: string;
  /** Result count, read as "Failed, 2". */
  count?: number;
}

export interface SegmentedProps {
  /** Accessible name of the group ("Result"). */
  label: string;
  options: SegmentedOption[];
  /** Id of the pressed option. */
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Filter buttons that behave like one choice (All / Passed / Failed). A `role="group"` of
 * buttons with `aria-pressed`. Announce the result count of the filtered list in a live region.
 */
export function Segmented({ label, options, value, onChange, className }: SegmentedProps) {
  return (
    <div role="group" aria-label={label} className={['segmented', className].filter(Boolean).join(' ')}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
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
