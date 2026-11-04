import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { MethodTag, type Protocol } from './method-tag';

export interface OpPickOption {
  id: string;
  method: string;
  protocol?: Protocol;
  path: string;
  /** Muted 12px line ("List pastries by size", "3 examples"). */
  summary?: ReactNode;
  /** Muted mono 11px line ("3 examples · +1 AI"). */
  meta?: ReactNode;
  /** End figure ("812"); `endLabel` is read before it. */
  end?: ReactNode;
  /** Hidden prefix of the end figure ("Calls over 7 days: "). */
  endLabel?: string;
  /** `warning`: the end is a warning 11px label (AI count). */
  endTone?: 'warning';
}

export interface OpPickListProps {
  options: OpPickOption[];
  /** Id of the selected operation. */
  value?: string;
  onChange: (id: string) => void;
  /** `toggle` (default): list of aria-pressed buttons. `radio`: radiogroup with arrow keys. */
  mode?: 'toggle' | 'radio';
  /** Accessible name. Or use `labelledBy` with the id of a visible heading. */
  label?: string;
  labelledBy?: string;
  className?: string;
}

function Card({ o }: { o: OpPickOption }) {
  return (
    <>
      {/* The spaces between the parts keep the button's accessible name readable ("GET /pastries List…"). */}
      <MethodTag method={o.method} protocol={o.protocol} />{' '}
      <span className="op-pick-main">
        <span className="op-pick-path">{o.path}</span>
        {o.summary ? <> <span className="op-pick-summary">{o.summary}</span></> : null}
        {o.meta ? <> <span className="op-pick-meta">{o.meta}</span></> : null}
      </span>{' '}
      {o.end !== undefined && o.end !== null ? (
        <span className="op-pick-end" data-tone={o.endTone}>
          {o.endLabel ? <><span className="sr-only">{o.endLabel}</span> </> : null}
          {o.end}
        </span>
      ) : null}
    </>
  );
}

/** Operation picker: one card per operation, one selected. */
export function OpPickList({ options, value, onChange, mode = 'toggle', label, labelledBy, className }: OpPickListProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const cls = ['op-pick-list', className].filter(Boolean).join(' ');

  if (mode === 'toggle') {
    return (
      <ul className={cls} aria-label={label} aria-labelledby={labelledBy}>
        {options.map((o) => (
          <li key={o.id}>
            <button type="button" className="op-pick" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
              <Card o={o} />
            </button>
          </li>
        ))}
      </ul>
    );
  }

  const checked = Math.max(0, options.findIndex((o) => o.id === value));
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = options.length;
    const next =
      e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (i + 1) % n
      : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : undefined;
    if (next === undefined) return;
    e.preventDefault();
    const o = options[next];
    if (o) onChange(o.id);
    refs.current[next]?.focus();
  };
  return (
    <div className={cls} role="radiogroup" aria-label={label} aria-labelledby={labelledBy}>
      {options.map((o, i) => (
        <button
          key={o.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          className="op-pick"
          aria-checked={o.id === value}
          tabIndex={i === checked ? 0 : -1}
          onClick={() => onChange(o.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          <Card o={o} />
        </button>
      ))}
    </div>
  );
}
