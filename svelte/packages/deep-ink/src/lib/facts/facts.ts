import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
type Content = string | Snippet;
export type FactTone = 'success' | 'warning' | 'danger' | 'muted';
export interface Fact { term: Content; value: Content; sub?: Content; mono?: boolean; tone?: FactTone; id?: string }
export interface FactsProps extends Omit<HTMLAttributes<HTMLDListElement>, 'class' | 'children'> {
  items?: Fact[]; layout?: 'rows' | 'inline' | 'columns'; boxed?: boolean | 'surface' | 'compact'; strong?: boolean;
  termWidth?: string; columns?: number; size?: 'sm' | 'md' | 'lg'; gap?: string; values?: 'text' | 'secondary';
  lineHeight?: 'inherit' | 'relaxed'; mono?: boolean; wrap?: 'normal' | 'pre'; class?: string; children?: Snippet;
}
export interface FactRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  term: Content; sub?: Content; mono?: boolean; tone?: FactTone; class?: string; children?: Snippet;
}
