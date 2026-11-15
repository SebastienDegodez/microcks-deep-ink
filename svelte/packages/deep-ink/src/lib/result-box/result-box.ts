import type { Snippet } from 'svelte';
import type { IconName } from '../icon/Icon.svelte';
export type ResultBoxTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';
export interface ResultBoxProps { tone?: ResultBoxTone; size?: 'sm' | 'md'; title?: string | Snippet; icon?: IconName | null; action?: Snippet; ondismiss?: () => void; dismissLabel?: string; live?: 'status' | 'off'; bordered?: boolean; surface?: 'surface' | 'raised'; density?: 'regular' | 'compact'; children?: Snippet }

import type { HTMLAttributes } from 'svelte/elements';
export interface ResultBoxProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children' | 'title' | 'role'> { tone?: ResultBoxTone; size?: 'sm' | 'md'; title?: string | Snippet; icon?: IconName | null; action?: Snippet; ondismiss?: () => void; dismissLabel?: string; live?: 'status' | 'off'; bordered?: boolean; surface?: 'surface' | 'raised'; density?: 'regular' | 'compact'; class?: string; children?: Snippet }
