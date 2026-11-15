import type { Snippet } from 'svelte';
export type BarTone = 'action' | 'success' | 'danger' | 'warning' | 'running';
export interface BarChartBar {
  id: string;
  value: number;
  description: string;
  label?: string;
  tone?: BarTone;
  future?: boolean;
  faded?: boolean;
  cap?: string;
}
export interface BarChartTable { caption: string; columns: string[]; rows: string[][] }
export interface BarChartProps {
  label: string;
  bars: BarChartBar[];
  max: number;
  selectedId?: string;
  onselect: (id: string) => void;
  selection?: 'outline' | 'fill';
  ticks?: string[];
  ticksEnd?: string[];
  grid?: number[];
  height?: number;
  gap?: number;
  minHeight?: number;
  overlay?: Snippet;
  table: BarChartTable;
  class?: string;
}
