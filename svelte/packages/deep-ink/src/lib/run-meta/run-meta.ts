import type { HTMLAttributes } from 'svelte/elements';
import type { NativeHandlers } from '../event-props';
import type { Snippet } from 'svelte';

export type RunMetaKind = 'text' | 'mono' | 'url' | 'chip';

export interface RunMetaItem {
  term: string | number | Snippet;
  value: string | number | Snippet;
  /** `mono` (durations), `url` (mono, link colour: wrap it in `<a>` when it navigates), `chip` (runner name). */
  kind?: RunMetaKind;
  /** Muted mono 12px detail after the value: the absolute date after "just now". */
  detail?: string | number | Snippet;
  id?: string;
}
export type RunMetaProps = Omit<HTMLAttributes<HTMLDListElement>, 'class' | 'children'> &
    NativeHandlers<HTMLDListElement> & { items: RunMetaItem[]; class?: string };
