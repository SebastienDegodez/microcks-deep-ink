
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '../Button.svelte';
  import type { ButtonSize, ButtonVariant } from '../button/button';
  import type { IconName } from '../icon/Icon.svelte';
  import type { MenuItem } from './menu';

  type Props = {
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
    class?: string;
    children?: Snippet;
  };

  let { label, icon, iconOnly, items, variant = 'secondary', size = 'md', align = 'start', class: cssClass, children }: Props = $props();

  const uid = $props.id();
  const menuId = `${uid}-menu`;
  let menu: HTMLDivElement | undefined = $state();
  let trigger: HTMLButtonElement | undefined = $state();
  let expanded = $state(false);

  const itemElements = () => Array.from(menu?.querySelectorAll<HTMLElement>('.menu-item:not(:disabled):not([aria-disabled="true"])') ?? []);

  const place = () => {
    if (!menu || !trigger) return;
    const r = trigger.getBoundingClientRect();
    const mh = menu.offsetHeight;
    const mw = menu.offsetWidth;
    const below = r.bottom + 4;
    const top = below + mh > window.innerHeight && r.top - 4 - mh > 0 ? r.top - 4 - mh : below;
    const wanted = align === 'end' ? r.right - mw : r.left;
    menu.style.top = `${Math.max(8, top)}px`;
    menu.style.left = `${Math.max(8, Math.min(wanted, window.innerWidth - mw - 8))}px`;
  };

  $effect(() => {
    if (!expanded) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  });

  const ontoggle = (e: Event) => {
    const open = (e as Event & { newState?: string }).newState === 'open';
    expanded = open;
    if (open) itemElements()[0]?.focus();
  };

  const close = () => menu?.hidePopover?.();

  // Keyboard and focus handling is attached natively: the popover container is not an interactive element.
  $effect(() => {
    const m = menu;
    if (!m) return;
    const onkeydown = (e: KeyboardEvent) => {
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
    const onfocusout = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (to && !m.contains(to) && !trigger?.contains(to)) m.hidePopover?.();
    };
    m.addEventListener('keydown', onkeydown);
    m.addEventListener('focusout', onfocusout);
    return () => {
      m.removeEventListener('keydown', onkeydown);
      m.removeEventListener('focusout', onfocusout);
    };
  });

  const select = (item: MenuItem) => {
    item.onselect?.();
    close();
  };
</script>

<Button
  bind:element={trigger}
  {variant}
  {size}
  {icon}
  {iconOnly}
  class={cssClass}
  aria-label={iconOnly ? label : undefined}
  aria-expanded={expanded}
  aria-controls={menuId}
  popovertarget={menuId}
  onkeydown={(e) => {
    if (e.key === 'ArrowDown' && expanded) {
      e.preventDefault();
      itemElements()[0]?.focus();
    }
  }}>{#if !iconOnly}{label}{/if}</Button
>
<div bind:this={menu} id={menuId} class="menu" popover="auto" role="group" aria-label={label} {ontoggle}
  >{#each items as item (item.id)}{@const descId = item.description ? `${menuId}-${item.id}-desc` : undefined}{#if item.separatorBefore}<hr
        class="menu-separator"
      />{/if}{#if item.href !== undefined}<a
        class="menu-item"
        href={item.href}
        data-tone={item.danger ? 'danger' : undefined}
        aria-disabled={item.disabled ? true : undefined}
        aria-describedby={descId}
        onclick={() => select(item)}>{item.label}</a
      >{:else}<button
        type="button"
        class="menu-item"
        data-tone={item.danger ? 'danger' : undefined}
        disabled={item.disabled}
        aria-describedby={descId}
        onclick={() => select(item)}>{item.label}</button
      >{/if}{#if item.description}<span class="menu-item-description" id={descId}>{item.description}</span>{/if}{/each}{@render
    children?.()}</div
>
