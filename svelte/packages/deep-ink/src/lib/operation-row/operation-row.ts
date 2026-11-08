import type { HTMLAttributes } from 'svelte/elements';
import type { Protocol } from '../types.js';
export interface OperationListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children' | 'aria-label'> { label: string; class?: string }
export interface OperationRowProps extends Omit<HTMLAttributes<HTMLLIElement>, 'class' | 'children' | 'onSelect'> {
  method: string; path: string; protocol?: Protocol; meta?: string; mockUrl?: string; selected?: boolean; href?: string; onselect?: () => void; class?: string;
}
