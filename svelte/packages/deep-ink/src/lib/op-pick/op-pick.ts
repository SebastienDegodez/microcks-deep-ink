import type { Snippet } from 'svelte';
import type { Protocol } from '../types.js';
/** Text, or a snippet that receives the option it renders (per-item content, as `render` in `table/table.ts`). */
export type OpPickContent = string | Snippet<[OpPickOption]>;
export interface OpPickOption {
  id: string; method: string; protocol?: Protocol; path: string;
  /** Muted 12px line ("List pastries by size", "3 examples"). A snippet receives this option. */
  summary?: OpPickContent;
  /** Muted mono 11px line ("3 examples · +1 AI"). A snippet receives this option. */
  meta?: OpPickContent;
  /** End figure ("812"); `endLabel` is read before it. A snippet receives this option. */
  end?: OpPickContent; endLabel?: string; endTone?: 'warning' | 'success';
}
export interface OpPickListProps {
  options: OpPickOption[]; value?: string; onchange: (id: string) => void; mode?: 'toggle' | 'radio';
  label?: string; labelledBy?: string; class?: string;
}
