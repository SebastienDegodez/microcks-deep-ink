import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role' | 'checked' | 'onChange' | 'children' | 'size'> {
  /** Visible label. Name what the switch controls, not its state. */
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** `md` (default): 36 x 20 track. `lg`: 42 x 24 track (Behavior). */
  size?: 'md' | 'lg';
  ref?: Ref<HTMLInputElement>;
}

/**
 * A native checkbox with `role="switch"`. Space toggles it; the state is announced as on or off.
 */
export function Switch({ label, description, checked, onChange, size = 'md', className, ref, ...rest }: SwitchProps) {
  const uid = useId();
  const descId = description ? `${uid}-desc` : undefined;
  const labelId = `${uid}-label`;
  return (
    <label className="choice">
      <input
        ref={ref}
        {...rest}
        type="checkbox"
        role="switch"
        aria-labelledby={labelId}
        className={['switch', className].filter(Boolean).join(' ')}
        data-size={size === 'lg' ? 'lg' : undefined}
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        aria-describedby={[rest['aria-describedby'], descId].filter(Boolean).join(' ') || undefined}
      />
      <span>
        <span className="choice-label" id={labelId}>
          {label}
        </span>
        {description ? (
          <span className="choice-description" id={descId}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
