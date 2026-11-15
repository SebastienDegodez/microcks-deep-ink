import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
export interface AiGhostRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'onSelect'> {
  name: string; onaccept: () => void; onedit: () => void; onreject: () => void; busy?: boolean; class?: string; children?: Snippet;
}
