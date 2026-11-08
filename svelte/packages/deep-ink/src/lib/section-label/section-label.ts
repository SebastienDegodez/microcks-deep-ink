import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
export type SectionLabelElement = 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label' | 'span' | 'p' | 'div';
export interface SectionLabelProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
  as?: SectionLabelElement; size?: 'md' | 'sm'; weight?: 'semibold' | 'regular'; split?: boolean;
  lineHeight?: 'fixed' | 'normal' | 'snug'; htmlFor?: string; class?: string; children?: Snippet;
}
