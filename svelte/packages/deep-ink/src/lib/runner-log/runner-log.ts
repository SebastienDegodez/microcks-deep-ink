import type { HTMLAttributes } from 'svelte/elements';
import type { NativeHandlers } from '../event-props';
import type { Snippet } from 'svelte';
export type RunnerLevel = 'INFO' | 'SEND' | 'PASS' | 'FAIL' | 'WARN' | 'WAIT';
export interface RunnerLine {
  time: string;
  level: RunnerLevel;
  text: string;
  /** Written in the main text colour. */
  emphasis?: boolean;
  /** Written in the danger colour. */
  error?: boolean;
}
export type RunnerLogProps = Omit<HTMLAttributes<HTMLElement>, 'class' | 'title' | 'children'> &
    NativeHandlers<HTMLElement> & {
    /** Visible heading, also the name of the log. */
    title?: string;
    /** End of the header: a LiveIndicator or "12 lines · completed". */
    status?: string | number | Snippet;
    lines: RunnerLine[];
    class?: string;
  };
