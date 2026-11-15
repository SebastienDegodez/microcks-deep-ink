import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';
export interface FilterBarProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> { label: string; class?: string; children?: Snippet }
export interface FilterRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> { title?: string; class?: string; children?: Snippet }
export interface FilterSearchProps extends Omit<HTMLInputAttributes, 'class' | 'type' | 'size'> { label: string; placeholder?: string; size?: 'md' | 'lg'; class?: string }
export interface FilterResetProps extends Omit<HTMLButtonAttributes, 'class' | 'children'> { count?: number; label?: string | Snippet; class?: string }
