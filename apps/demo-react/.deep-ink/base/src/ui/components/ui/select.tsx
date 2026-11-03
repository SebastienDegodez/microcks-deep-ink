// Deep Ink · select@0.2.0 · copied from packages/registry. You own this file.
import type { Ref, SelectHTMLAttributes } from 'react';

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  size?: 'md' | 'sm';
  ref?: Ref<HTMLSelectElement>;
};

/**
 * Native `<select>`. The browser provides the keyboard behavior and the picker.
 * Give it a visible label with `Field` (or a `<label for>`).
 */
export function Select({ size = 'md', className, children, ref, ...rest }: SelectProps) {
  return (
    <select ref={ref} {...rest} className={['select', className].filter(Boolean).join(' ')} data-size={size}>
      {children}
    </select>
  );
}
