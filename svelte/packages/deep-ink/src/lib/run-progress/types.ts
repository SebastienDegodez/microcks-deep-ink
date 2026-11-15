import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type RunSegment = 'done' | 'failed' | 'warn' | 'current' | 'queued';

export interface RunCount {
  kind: 'pass' | 'fail' | 'warn' | 'pending';
  /** "4 passed" */
  text: string;
}

export interface RunProgressProps extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
  class?: string;
  /** Accessible name of the section (the only naming API: it wins over a passed `aria-label`). */
  label?: string;
  /** busy marks the bar as updating (aria-busy="true" on the bar only); step announcements are not affected. Absent by default. */
  busy?: boolean;
  done: number;
  total: number;
  /** "test steps done", "matrix cells filled". */
  caption: string;
  /** "Now calling", "Now checking". */
  nowLabel?: string;
  /** What runs now: "PATCH /pastries/{name}". Announced politely when it changes. */
  now?: string;
  /** One entry per step, in order. */
  segments: RunSegment[];
  counts?: RunCount[];
  /** A control at the end of the counts row ("Step forward"). */
  action?: string | number | Snippet;
  note?: string | number | Snippet;
  /** Gap between segments in px (4 by default, 3 for dense matrices). */
  gap?: number;
}
