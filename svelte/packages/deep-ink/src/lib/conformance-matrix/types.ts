import type { HTMLAttributes } from 'svelte/elements';
export type CheckResult = 'pass' | 'fail' | 'warn' | 'running' | 'queued';
export interface MatrixColumn { id: string; label: string; sub?: string }
export interface MatrixCell { columnId?: string; result: CheckResult; label?: string; duration?: string }
export interface MatrixRow { id: string; label: string; sub?: string; mono?: boolean; cells: MatrixCell[] }
export interface MatrixGroup { id: string; label: string; sub?: string; rows: MatrixRow[] }
export interface MatrixFooterCell { text: string; tone?: 'success' | 'danger' }
export interface ConformanceMatrixProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onselect'> {
  caption: string;
  columns: MatrixColumn[];
  groups: MatrixGroup[];
  footer?: { label: string; cells: MatrixFooterCell[] };
  selectedKey?: string;
  onselectcell?: (key: string | undefined) => void;
}
