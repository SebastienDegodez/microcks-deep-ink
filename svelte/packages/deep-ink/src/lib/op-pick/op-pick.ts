import type { Snippet } from 'svelte';
import type { Protocol } from '../types.js';
export type OpPickContent = string | Snippet;
export interface OpPickOption {
  id: string; method: string; protocol?: Protocol; path: string; summary?: OpPickContent; meta?: OpPickContent;
  end?: OpPickContent; endLabel?: string; endTone?: 'warning' | 'success';
}
export interface OpPickListProps {
  options: OpPickOption[]; value?: string; onchange: (id: string) => void; mode?: 'toggle' | 'radio';
  label?: string; labelledBy?: string; class?: string;
}
