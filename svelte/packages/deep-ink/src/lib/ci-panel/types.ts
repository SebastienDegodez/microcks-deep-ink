import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export interface CiPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'class' | 'children'> {
  class?: string;
  /** Names the region ("Run this test in your pipeline"). */
  title: string | number | Snippet;
  /** After the title: an ApiBadge `cli | proposed`, a ProjectionPill. */
  pill?: string | number | Snippet;
  /** 12px muted line under the title. */
  hint?: string | number | Snippet;
  /** The command, copied by the Copy button. It wraps. */
  command: string;
  /** 12px muted note under the command. */
  footnote?: string | number | Snippet;
  /** Dashed frame (a projected, not-yet-available command: AgentTestRun). */
  dashed?: boolean;
  /** Label of the copy button (default "Copy"; "Copy command" on AgentTestRun). */
  copyLabel?: string;
}
