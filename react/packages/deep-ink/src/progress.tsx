import { useId, type MeterHTMLAttributes, type ProgressHTMLAttributes } from 'react';

export interface ProgressProps extends Omit<ProgressHTMLAttributes<HTMLProgressElement>, 'value' | 'max'> {
  /** Visible label. */
  label: string;
  /** Omit for an indeterminate progress. */
  value?: number;
  max?: number;
  /** Written value while indeterminate. */
  indeterminateLabel?: string;
}

/** Native <progress> with a visible label and a written value (never color alone). */
export function Progress({ label, value, max = 100, indeterminateLabel = 'In progress', className, id, ...rest }: ProgressProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const percent = value === undefined ? undefined : Math.round((value / max) * 100);
  return (
    <div className="progress-field">
      <div className="progress-head">
        <label className="progress-label" htmlFor={fieldId}>
          {label}
        </label>
        <span className="progress-value">{percent === undefined ? indeterminateLabel : `${percent}%`}</span>
      </div>
      <progress {...rest} id={fieldId} className={['progress', className].filter(Boolean).join(' ')} value={value} max={max} />
    </div>
  );
}

export interface MeterProps extends Omit<MeterHTMLAttributes<HTMLMeterElement>, 'value' | 'min' | 'max' | 'low' | 'high'> {
  label: string;
  value: number;
  min?: number;
  max: number;
  low?: number;
  high?: number;
  optimum?: number;
  /** Written value, e.g. "11 of 12". Defaults to value / max. */
  valueText?: string;
}

/** Native <meter>. The value is always written next to the bar. */
export function Meter({ label, value, min = 0, max, low, high, optimum, valueText, className, id, ...rest }: MeterProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <div className="progress-field">
      <div className="progress-head">
        <label className="progress-label" htmlFor={fieldId}>
          {label}
        </label>
        <span className="progress-value">{valueText ?? `${value} / ${max}`}</span>
      </div>
      <meter
        {...rest}
        id={fieldId}
        className={['meter', className].filter(Boolean).join(' ')}
        value={value}
        min={min}
        max={max}
        low={low}
        high={high}
        optimum={optimum ?? max}
      />
    </div>
  );
}
