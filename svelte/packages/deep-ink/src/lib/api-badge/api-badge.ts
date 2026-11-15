import type { Protocol } from '../types.js';
import type { IconName } from '../icon/Icon.svelte';
export type { Protocol } from '../types.js';
export type ProofStatus = 'success' | 'danger' | 'warning' | 'info' | 'action' | 'neutral' | 'muted' | 'text' | 'plain' | 'positive' | 'protocol';
export interface ProofValue { value?: string; status?: ProofStatus; icon?: IconName; iconLabel?: string }
import type { HTMLAttributes } from 'svelte/elements';
export interface ApiBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  protocol?: Protocol; arazzo?: boolean; name?: string; version?: string; label?: string; value?: string;
  status?: ProofStatus; icon?: IconName; iconLabel?: string; values?: ReadonlyArray<ProofValue>;
  versionTone?: 'muted' | 'text'; size?: 'sm' | 'compact' | 'md' | 'card' | 'lg' | 'xl'; class?: string;
}
