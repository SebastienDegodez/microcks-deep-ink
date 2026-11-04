// Deep Ink · filter-bar@0.2.0 · copied from packages/registry. You own this file.
import { useId } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from './icon';

export interface FilterBarProps extends HTMLAttributes<HTMLElement> {
  /** Accessible name of the region: "Catalogue filters". */
  label: string;
}

/** A named box of filter rows. Put a `FilterSearch` and controls in the first `FilterRow`. */
export function FilterBar({ label, className, children, ...rest }: FilterBarProps) {
  return (
    <section {...rest} aria-label={label} className={['filter-bar', className].filter(Boolean).join(' ')}>
      {children}
    </section>
  );
}

export interface FilterRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Row title ("Protocol", "Labels"). It names the row as a group. */
  title?: string;
}

/** One row of filters. With a title it is a `role="group"` named by it. */
export function FilterRow({ title, className, children, ...rest }: FilterRowProps) {
  const id = useId();
  return (
    <div {...rest} className={['filter-bar-row', className].filter(Boolean).join(' ')} role={title ? 'group' : undefined} aria-labelledby={title ? id : undefined}>
      {title ? (
        <span className="filter-bar-label" id={id}>
          {title}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export interface FilterSearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Accessible name of the field, also its placeholder unless you set one. */
  label: string;
  /** `md` is 38px high, up to 420px; `lg` is 40px, up to 480px (a page-level search, Hub). */
  size?: 'md' | 'lg';
}

/** Search field with a leading icon. The label is visually hidden; the placeholder repeats it. */
export function FilterSearch({ label, placeholder, size = 'md', className, ...rest }: FilterSearchProps) {
  return (
    <label className={['filter-bar-search', className].filter(Boolean).join(' ')} data-size={size}>
      <Icon name="search" size={16} />
      <span className="sr-only">{label}</span>
      <input type="search" placeholder={placeholder ?? label} {...rest} />
    </label>
  );
}

export interface FilterResetProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Number of active filters, written as "Reset (2)". */
  count?: number;
  label?: ReactNode;
}

/** Link-style reset at the end of a row. Disabled when no filter is active. */
export function FilterReset({ count, label = 'Reset', className, ...rest }: FilterResetProps) {
  return (
    <button type="button" disabled={count === 0} {...rest} className={['filter-bar-reset', className].filter(Boolean).join(' ')}>
      <Icon name="reset" size={14} />
      {label}
      {count !== undefined ? ` (${count})` : null}
    </button>
  );
}
