import type { IconName } from '../icon/Icon.svelte';

export interface ShellNavItem {
  id: string;
  label: string;
  href: string;
  /** Icon name from the icon item. */
  icon?: IconName;
  badge?: string;
}

/**
 * Attributes to spread on the link you render in `renderLink`, as React's ShellLinkProps but under their Svelte names
 * (`class`, `onclick`). The link content (icon, label, badge) is the snippet's third argument, React's `props.children`.
 */
export interface ShellLinkProps {
  class: string;
  href: string;
  'aria-current'?: 'page';
  onclick: () => void;
}
