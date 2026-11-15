import type { HTMLAttributes } from 'svelte/elements';

export type StepOutcome = 'passed' | 'failed' | 'not-run';

export type CheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';

export interface StepStatusProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  class?: string;
  status: StepOutcome;
  attempts?: number;
}

export interface StepChecksProps extends Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children'> {
  class?: string;
  successCriteria: CheckState;
  /** Omit when the run does not validate schemas. */
  schemaValidation?: CheckState;
}
