import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export interface StepperStep {
  label: string | number | Snippet;
  /** `progress` only. Default `upcoming`. */
  state?: 'done' | 'current' | 'upcoming';
  /** Shown number; defaults to the position (1, 2, 3). */
  n?: string | number | Snippet;
  id?: string;
}

export interface StepperProps extends Omit<HTMLAttributes<HTMLOListElement>, 'children' | 'class'> {
  class?: string;
  /** Accessible name of the list ("Progress", "Before you paste"). Optional: leave it out when the heading above names the list. */
  label?: string;
  steps: StepperStep[];
  /** `progress` (default): numbered dots. `list`: numbered instructions. */
  variant?: 'progress' | 'list';
  /** `progress` only: stack the steps. */
  direction?: 'horizontal' | 'vertical';
  /** Hidden word read after a done step (default "done"). */
  doneLabel?: string;
  /** `list` only. `number` (default): a mono "1.". `circle`: the number in a 22px ring (--stepper-marker, default --proto-rest), 10px gap, 6px rows, the text stacked in a column in the inherited font (WorkflowRun plan). */
  marker?: 'number' | 'circle';
}
