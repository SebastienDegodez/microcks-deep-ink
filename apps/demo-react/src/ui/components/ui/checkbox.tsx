// Deep Ink · checkbox@0.2.0 · copied from packages/registry. You own this file.
import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { Icon } from './icon';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

interface ChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'children'> {
  /** Visible label. */
  label: ReactNode;
  /** Secondary text, linked with aria-describedby. */
  description?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export type CheckboxProps = ChoiceProps;
export type RadioProps = ChoiceProps;

function Choice({ kind, label, description, className, ref, ...rest }: ChoiceProps & { kind: 'checkbox' | 'radio' }) {
  const uid = useId();
  const descId = description ? `${uid}-desc` : undefined;
  const labelId = `${uid}-label`;
  return (
    <label className="di-choice">
      <input
        ref={ref}
        {...rest}
        type={kind}
        aria-labelledby={labelId}
        className={cx(kind === 'checkbox' ? 'di-checkbox' : 'di-radio', className)}
        aria-describedby={cx(rest['aria-describedby'], descId) || undefined}
      />
      <span>
        <span className="di-choice-label" id={labelId}>
          {label}
        </span>
        {description ? (
          <span className="di-choice-description" id={descId}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** Native checkbox inside its label. */
export function Checkbox(props: CheckboxProps) {
  return <Choice kind="checkbox" {...props} />;
}

/** Native radio inside its label. Use `RadioGroup` to group several. */
export function Radio(props: RadioProps) {
  return <Choice kind="radio" {...props} />;
}

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** Visible group name, rendered as the fieldset legend. */
  legend: ReactNode;
  options: RadioOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  /** Shared name of the radios. Generated when omitted. */
  name?: string;
  required?: boolean;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
}

/**
 * `fieldset` + `legend` + native radios. Arrow keys move the selection (native behavior).
 */
export function RadioGroup({ legend, options, value, onChange, name, required, help, error, className }: RadioGroupProps) {
  const uid = useId();
  const groupName = name ?? `${uid}-group`;
  const helpId = help ? `${uid}-help` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  return (
    <fieldset
      className={cx('di-fieldset', className)}
      aria-describedby={cx(helpId, errorId) || undefined}
      aria-invalid={error ? true : undefined}
      data-invalid={error ? '' : undefined}
    >
      <legend>
        {legend}
        {required ? (
          <span className="di-required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </legend>
      {options.map((o) => (
        <Radio
          key={o.value}
          name={groupName}
          value={o.value}
          label={o.label}
          description={o.description}
          disabled={o.disabled}
          required={required}
          checked={value === o.value}
          onChange={() => onChange(o.value)}
        />
      ))}
      {help ? (
        <p className="di-help" id={helpId}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="di-error" id={errorId}>
          <Icon name="warning" size={16} />
          <span>
            <span className="di-sr-only">Error: </span>
            {error}
          </span>
        </p>
      ) : null}
    </fieldset>
  );
}
