import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
export interface SplitPaneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  sideWidth?: string;
  sideMax?: string;
  mainWidth?: string;
  gap?: string;
  align?: 'start' | 'stretch';
  balanced?: boolean;
  keepSideMax?: boolean;
  children?: Snippet;
}
export interface SplitPanePaneProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  as?: 'div' | 'section' | 'aside' | 'nav' | 'ul' | 'ol';
  children?: Snippet;
}
