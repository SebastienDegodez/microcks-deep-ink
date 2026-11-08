import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
export type StatCardTone = 'neutral' | 'success' | 'warning' | 'danger';
export interface StatCardProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
  title: string | Snippet; headingLevel?: 2 | 3 | 4 | 5 | 6; action?: Snippet; value: string | Snippet;
  unit?: string | Snippet; tone?: StatCardTone; class?: string; children?: Snippet;
}
export interface StatGridProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> { label: string; class?: string; children?: Snippet }
