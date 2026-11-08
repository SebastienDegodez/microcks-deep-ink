import type { HTMLAttributes } from 'svelte/elements';
import type { OperationResult } from './model.js';
export interface ConformanceBandProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  outcomes: OperationResult[];
  size?: 'full' | 'mini';
  labels?: string[];
  showSummary?: boolean;
  unit?: string;
}
