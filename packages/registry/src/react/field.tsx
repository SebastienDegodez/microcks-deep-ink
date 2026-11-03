import { useId } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './icon';

/** Props to spread on the form control rendered inside a `Field`. */
export interface FieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true;
  required?: boolean;
}

export interface FieldProps {
  /** Visible label. Always rendered. */
  label: ReactNode;
  help?: ReactNode;
  /** Error message. Shown with an icon and the word "Error", never color alone. */
  error?: ReactNode;
  required?: boolean;
  /** Receives the props to spread on the control: `{(control) => <Input {...control} />}`. */
  children: (control: FieldControlProps) => ReactNode;
  className?: string;
}

/**
 * Label, control, help and error wired together: `for`/`id`, `aria-describedby`,
 * `aria-invalid` and `required`.
 */
export function Field({ label, help, error, required, children, className }: FieldProps) {
  const uid = useId();
  const id = `${uid}-control`;
  const helpId = help ? `${uid}-help` : undefined;
  const errorId = error ? `${uid}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={['di-field', className].filter(Boolean).join(' ')} data-invalid={error ? '' : undefined}>
      <label className="di-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="di-required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required: required || undefined })}
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
    </div>
  );
}
