import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from 'react';
import { Icon } from './icon';

export type ChipTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ChipVariant = 'solid' | 'outline' | 'dashed';

interface ChipOwnProps {
  /** Key rendered before the text for `key=value` labels. */
  labelKey?: string;
  tone?: ChipTone;
  variant?: ChipVariant;
  /** When defined the chip is a toggle `<button aria-pressed>` (filters). */
  pressed?: boolean;
  /** Adds a remove button. Ignored on toggle chips. */
  onRemove?: () => void;
  /** Accessible name of the remove button when the chip text is not a string. */
  removeLabel?: string;
  children?: ReactNode;
}

export type ChipProps = ChipOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof ChipOwnProps | 'onClick'> & {
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
    ref?: Ref<HTMLElement>;
  };

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return '';
}

/**
 * Small label. Static chips are a `<span>`; with `pressed` they become a toggle button;
 * with `onRemove` they get a remove button named "Remove <text>".
 */
export function Chip({ labelKey, tone = 'neutral', variant = 'solid', pressed, onRemove, removeLabel, className, children, ref, onClick, ...rest }: ChipProps) {
  const cls = ['chip', className].filter(Boolean).join(' ');
  const body = (
    <>
      {labelKey ? <span className="chip-key">{labelKey}=</span> : null}
      {children}
    </>
  );

  if (pressed !== undefined) {
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        className={cls}
        data-tone={tone}
        data-variant={variant}
        aria-pressed={pressed}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  const name = removeLabel ?? `Remove ${[labelKey, textOf(children)].filter(Boolean).join(' ')}`.trim();
  return (
    <span ref={ref as Ref<HTMLSpanElement>} {...rest} className={cls} data-tone={tone} data-variant={variant}>
      {body}
      {onRemove ? (
        <button type="button" className="chip-remove" aria-label={name} onClick={onRemove}>
          <Icon name="close" size={12} />
        </button>
      ) : null}
    </span>
  );
}
