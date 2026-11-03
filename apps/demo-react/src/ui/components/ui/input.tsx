// Deep Ink · input@0.2.0 · copied from packages/registry. You own this file.
import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react';

type Size = 'md' | 'sm';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** Monospaced text for paths, URLs and identifiers. */
  mono?: boolean;
  size?: Size;
  ref?: Ref<HTMLInputElement>;
};

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
  mono?: boolean;
  size?: Size;
  ref?: Ref<HTMLTextAreaElement>;
};

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

/**
 * Native `<input>`. Give it a visible label with `Field` (or a `<label for>`); a placeholder is not a label.
 */
export function Input({ mono, size = 'md', className, type = 'text', ref, ...rest }: InputProps) {
  return <input ref={ref} type={type} {...rest} className={cx('di-input', className)} data-mono={mono ? '' : undefined} data-size={size} />;
}

/** Native `<textarea>` with the same styling as `Input`. */
export function Textarea({ mono, size = 'md', className, ref, ...rest }: TextareaProps) {
  return <textarea ref={ref} {...rest} className={cx('di-input', className)} data-mono={mono ? '' : undefined} data-size={size} />;
}
