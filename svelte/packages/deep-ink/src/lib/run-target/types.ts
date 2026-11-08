import type { HTMLAttributes } from 'svelte/elements';

export type RunTargetKind = 'mocks' | 'implementations' | 'mixed';

export interface RunTargetProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  class?: string;
  target: RunTargetKind;
}
