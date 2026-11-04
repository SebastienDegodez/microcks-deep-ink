import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react';

type Size = 'md' | 'sm';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** Monospaced text for paths, URLs and identifiers. */
  mono?: boolean;
  size?: Size;
  /** `bg`: on the page background instead of the surface (Import). */
  surface?: 'surface' | 'bg';
  ref?: Ref<HTMLInputElement>;
};

export type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> & {
  mono?: boolean;
  size?: Size;
  surface?: 'surface' | 'bg';
  ref?: Ref<HTMLTextAreaElement>;
};

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

/**
 * Native `<input>`. Give it a visible label with `Field` (or a `<label for>`); a placeholder is not a label.
 */
export function Input({ mono, size = 'md', surface, className, type = 'text', ref, ...rest }: InputProps) {
  return <input ref={ref} type={type} {...rest} className={cx('input', className)} data-mono={mono ? '' : undefined} data-size={size} data-surface={surface === 'bg' ? 'bg' : undefined} />;
}

/** Native `<textarea>` with the same styling as `Input`. */
export function Textarea({ mono, size = 'md', surface, className, ref, ...rest }: TextareaProps) {
  return <textarea ref={ref} {...rest} className={cx('input', className)} data-mono={mono ? '' : undefined} data-size={size} data-surface={surface === 'bg' ? 'bg' : undefined} />;
}
