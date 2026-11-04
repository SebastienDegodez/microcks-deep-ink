import { cloneElement, isValidElement } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Icon } from './icon';
import type { IconName } from './icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'dashed' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface ButtonOwnProps {
  /** One primary per task region. `link` is a small text button (Copy, Clear list); `dashed` an add / try action. */
  variant?: ButtonVariant;
  /** `md` is 40px high. `sm` is 32px and is never used for the primary action of a page. */
  size?: ButtonSize;
  /** Filled danger, only inside a confirmation dialog. Use with `variant="danger"`. */
  confirm?: boolean;
  /** Leading icon name. */
  icon?: IconName;
  /** Icon-only button. Requires an accessible name (`aria-label`). */
  iconOnly?: boolean;
  /** Sets `aria-busy` and disables the button. */
  loading?: boolean;
  children?: ReactNode;
}

export type ButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & {
    ref?: Ref<HTMLButtonElement>;
    /** Render the single child element with the button styling instead of a `<button>` (for router links). */
    asChild?: boolean;
  };

export type ButtonLinkProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps> & {
    ref?: Ref<HTMLAnchorElement>;
  };

const warned = new Set<string>();
function requireName(component: string, iconOnly: boolean | undefined, props: Record<string, unknown>) {
  if (!iconOnly || props['aria-label'] || props['aria-labelledby'] || props.title) return;
  const key = `${component}:icon-only`;
  if (warned.has(key)) return;
  warned.add(key);
  console.error(`Deep Ink ${component}: an icon-only button needs an accessible name. Add aria-label.`);
}

function contents(icon: IconName | undefined, size: ButtonSize, variant: ButtonVariant, children: ReactNode) {
  return (
    <>
      {icon ? <Icon name={icon} size={size === 'sm' || variant === 'link' || variant === 'dashed' ? 14 : 16} /> : null}
      {children}
    </>
  );
}

function classes(className?: string) {
  return ['button', className].filter(Boolean).join(' ');
}

/**
 * Native `<button>` with the `button` styling. Defaults to `type="button"`.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  confirm,
  icon,
  iconOnly,
  loading,
  asChild,
  className,
  children,
  disabled,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  requireName('Button', iconOnly, rest);
  const shared = {
    className: classes(className),
    'data-variant': variant,
    'data-size': size,
    'data-confirm': confirm ? '' : undefined,
    'data-icon-only': iconOnly ? '' : undefined,
    'aria-busy': loading ? true : undefined,
  };
  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>;
    return cloneElement(child, {
      ...rest,
      ...shared,
      className: [shared.className, child.props.className].filter(Boolean).join(' '),
      children: contents(icon, size, variant, child.props.children),
    } as Record<string, unknown>);
  }
  return (
    <button ref={ref} type={type} disabled={disabled || loading} {...rest} {...shared}>
      {contents(icon, size, variant, children)}
    </button>
  );
}

/** Same styling as `Button`, on a native `<a>`. Use it for navigation, `Button` for actions. */
export function ButtonLink({
  variant = 'secondary',
  size = 'md',
  confirm,
  icon,
  iconOnly,
  loading,
  className,
  children,
  ref,
  ...rest
}: ButtonLinkProps) {
  requireName('ButtonLink', iconOnly, rest);
  return (
    <a
      ref={ref}
      {...rest}
      className={classes(className)}
      data-variant={variant}
      data-size={size}
      data-confirm={confirm ? '' : undefined}
      data-icon-only={iconOnly ? '' : undefined}
      aria-busy={loading ? true : undefined}
    >
      {contents(icon, size, variant, children)}
    </a>
  );
}
