import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import { Button } from './button';
import type { ButtonSize, ButtonVariant } from './button';
import type { IconName } from './icon';

export interface MenuItem {
  id: string;
  label: string;
  onSelect?: () => void;
  /** Renders an `<a>` for navigation instead of a `<button>`. */
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  /** Name of the trigger. With `iconOnly` it is the accessible name ("Actions"). */
  label: string;
  icon?: IconName;
  /** Show only the icon. Requires `icon`. */
  iconOnly?: boolean;
  items: MenuItem[];
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Which edge of the trigger the menu lines up with. */
  align?: 'start' | 'end';
  className?: string;
  /** Extra content after the items. */
  children?: ReactNode;
}

/**
 * Disclosure menu on the native `popover` attribute. The trigger is a button with
 * `popovertarget` and a mirrored `aria-expanded`. Escape and click outside close it natively.
 * Up and Down move between items, Home and End jump to the ends.
 */
export function Menu({ label, icon, iconOnly, items, variant = 'secondary', size = 'md', align = 'start', className, children }: MenuProps) {
  const uid = useId();
  const menuId = `${uid}-menu`;
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);

  const itemElements = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('.menu-item:not(:disabled):not([aria-disabled="true"])') ?? []);

  const place = () => {
    const m = menu.current;
    const t = trigger.current;
    if (!m || !t) return;
    const r = t.getBoundingClientRect();
    const mh = m.offsetHeight;
    const mw = m.offsetWidth;
    const below = r.bottom + 4;
    const top = below + mh > window.innerHeight && r.top - 4 - mh > 0 ? r.top - 4 - mh : below;
    const wanted = align === 'end' ? r.right - mw : r.left;
    const left = Math.max(8, Math.min(wanted, window.innerWidth - mw - 8));
    m.style.top = `${Math.max(8, top)}px`;
    m.style.left = `${left}px`;
  };

  useEffect(() => {
    if (!expanded) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  });

  const onToggle = (e: SyntheticEvent<HTMLDivElement>) => {
    const open = (e.nativeEvent as Event & { newState?: string }).newState === 'open';
    setExpanded(open);
    if (open) itemElements()[0]?.focus();
  };

  const close = () => menu.current?.hidePopover?.();

  // Keyboard and focus handling is attached natively: the popover container is not an interactive element.
  useEffect(() => {
    const m = menu.current;
    if (!m) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const els = itemElements();
      if (els.length === 0) return;
      const at = els.indexOf(document.activeElement as HTMLElement);
      let next: HTMLElement | undefined;
      if (e.key === 'ArrowDown') next = els[(at + 1) % els.length];
      else if (e.key === 'ArrowUp') next = els[(at - 1 + els.length) % els.length];
      else if (e.key === 'Home') next = els[0];
      else if (e.key === 'End') next = els[els.length - 1];
      else return;
      if (!next) return;
      e.preventDefault();
      next.focus();
    };
    // Tabbing out of the menu closes it, so it never stays open behind the user.
    const onFocusOut = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (to && !m.contains(to) && !trigger.current?.contains(to)) m.hidePopover?.();
    };
    m.addEventListener('keydown', onKeyDown);
    m.addEventListener('focusout', onFocusOut);
    return () => {
      m.removeEventListener('keydown', onKeyDown);
      m.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return (
    <>
      <Button
        ref={trigger}
        variant={variant}
        size={size}
        icon={icon}
        iconOnly={iconOnly}
        className={className}
        aria-label={iconOnly ? label : undefined}
        aria-expanded={expanded}
        aria-controls={menuId}
        popoverTarget={menuId}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && expanded) {
            e.preventDefault();
            itemElements()[0]?.focus();
          }
        }}
      >
        {iconOnly ? null : label}
      </Button>
      <div
        ref={menu}
        id={menuId}
        className="menu"
        popover="auto"
        role="group"
        aria-label={label}
        onToggle={onToggle}
      >
        {items.map((item) =>
          item.href !== undefined ? (
            <a
              key={item.id}
              className="menu-item"
              href={item.href}
              data-tone={item.danger ? 'danger' : undefined}
              aria-disabled={item.disabled ? true : undefined}
              onClick={() => {
                item.onSelect?.();
                close();
              }}
            >
              {item.label}
            </a>
          ) : (
            <button
              key={item.id}
              type="button"
              className="menu-item"
              data-tone={item.danger ? 'danger' : undefined}
              disabled={item.disabled}
              onClick={() => {
                item.onSelect?.();
                close();
              }}
            >
              {item.label}
            </button>
          ),
        )}
        {children}
      </div>
    </>
  );
}
