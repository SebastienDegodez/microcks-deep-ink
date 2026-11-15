/** A missing column denotes a check spanning the whole matrix. */
export function cellKey(rowId: string, columnId?: string): string { return `${rowId}|${columnId ?? '*'}`; }
