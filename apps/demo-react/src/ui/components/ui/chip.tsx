// Deep Ink · chip@0.2.0 · copied from packages/registry. You own this file.
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from 'react';
import { Icon } from './icon';

export type ChipTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ChipVariant = 'solid' | 'outline' | 'dashed';
export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

interface ChipOwnProps {
  /** Key rendered before the text for `key=value` labels. */
  labelKey?: string;
  tone?: ChipTone;
  variant?: ChipVariant;
  /** `sm`: 11px, padding 1px 8px (row labels). */
  size?: 'md' | 'sm';
  /** Protocol filter: square corners and a colour swatch; pressed fills with the protocol colour. */
  protocol?: Protocol;
  /** Count after the text, read as "REST 4". A zero count dims the chip. */
  count?: number;
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
const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };

export function Chip({ labelKey, tone = 'neutral', variant = 'solid', size = 'md', protocol, count, pressed, onRemove, removeLabel, className, children, ref, onClick, ...rest }: ChipProps) {
  const cls = ['chip', className].filter(Boolean).join(' ');
  const data = {
    'data-tone': tone,
    'data-variant': variant,
    'data-size': size,
    'data-protocol': protocol ? PROTOCOL_ATTR[protocol] : undefined,
    'data-empty': count === 0 ? '' : undefined,
  };
  const body = (
    <>
      <span className="chip-label">
        {labelKey ? (
          <>
            <span className="chip-key">{labelKey}</span>
            <span className="chip-eq">=</span>
          </>
        ) : null}
        <span className="chip-value">{children}</span>
      </span>
      {count !== undefined ? (
        <>
          {' '}
          <span className="chip-count">{count}</span>
        </>
      ) : null}
    </>
  );

  if (pressed !== undefined) {
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        className={cls}
        {...data}
        aria-pressed={pressed}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  const name = removeLabel ?? `Remove ${[labelKey, textOf(children)].filter(Boolean).join(' ')}`.trim();
  return (
    <span ref={ref as Ref<HTMLSpanElement>} {...rest} className={cls} {...data}>
      {body}
      {onRemove ? (
        <button type="button" className="chip-remove" aria-label={name} onClick={onRemove}>
          <Icon name="close" size={12} />
        </button>
      ) : null}
    </span>
  );
}
