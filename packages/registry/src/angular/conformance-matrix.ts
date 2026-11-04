import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from './icon';
import type { IconName } from './icon';

export type CheckResult = 'pass' | 'fail' | 'warn' | 'running' | 'queued';

export interface MatrixColumn {
  id: string;
  label: string;
  /** Small text under the label: "preferred · SSE". */
  sub?: string;
}

export interface MatrixCell {
  /** Column of the cell. Omit it for a cell that spans every column. */
  columnId?: string;
  result: CheckResult;
  /** Word shown instead of the default one ("Absent" for a missing signature). */
  label?: string;
  /** Duration, shown once the check has finished. */
  duration?: string;
}

export interface MatrixRow {
  id: string;
  label: string;
  sub?: string;
  /** Mono label (an identifier). */
  mono?: boolean;
  /** One cell per column, or a single cell without `columnId` that spans every column. */
  cells: MatrixCell[];
}

export interface MatrixGroup {
  id: string;
  label: string;
  sub?: string;
  rows: MatrixRow[];
}

export interface MatrixFooterCell {
  text: string;
  tone?: 'success' | 'danger';
}

const RESULT: Record<CheckResult, { word: string; icon: IconName }> = {
  pass: { word: 'Passed', icon: 'check' },
  fail: { word: 'Failed', icon: 'cross' },
  warn: { word: 'Warning', icon: 'warning' },
  running: { word: 'Running', icon: 'running' },
  queued: { word: 'Queued', icon: 'circle' },
};

/** Key of a cell: `<rowId>|<columnId>`, or `<rowId>|*` for a cell that spans every column. */
export function cellKey(rowId: string, columnId?: string): string {
  return `${rowId}|${columnId ?? '*'}`;
}

/**
 * Checks by columns (transports, environments). Each cell writes its result with a glyph and a word; a finished
 * cell is a button (`selectable`) that selects it, so the detail can sit under the table. Cells that are still
 * queued or running are plain text, not disabled buttons.
 */
@Component({
  selector: 'mk-conformance-matrix',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'matrix-wrap', role: 'region', tabindex: '0', '[attr.aria-label]': 'caption()' },
  template: `
    <table class="matrix" [style.--matrix-columns]="columns().length">
      <caption class="sr-only">{{ caption() }}</caption>
      <thead>
        <tr>
          <th scope="col">Check</th>
          @for (c of columns(); track c.id) {
            <th scope="col">
              <span>{{ c.label }}</span>
              @if (c.sub) {
                <span class="matrix-sub">{{ c.sub }}</span>
              }
            </th>
          }
        </tr>
      </thead>
      @for (g of groups(); track g.id) {
        <tbody>
          <tr class="matrix-group">
            <th scope="rowgroup" [attr.colspan]="columns().length + 1">
              {{ g.label }}
              @if (g.sub) {
                <span class="matrix-sub"> · {{ g.sub }}</span>
              }
            </th>
          </tr>
          @for (r of g.rows; track r.id) {
            <tr>
              <th scope="row" [attr.data-mono]="r.mono ? '' : null">
                <span>{{ r.label }}</span>
                @if (r.sub) {
                  <span class="matrix-sub">{{ r.sub }}</span>
                }
              </th>
              @for (cell of r.cells; track $index) {
                <td [attr.colspan]="cell.columnId ? 1 : columns().length" [attr.data-result]="cell.result">
                  @if (finished(cell) && selectable()) {
                    <button
                      type="button"
                      class="matrix-cell"
                      [attr.aria-pressed]="selectedKey() === key(r.id, cell.columnId)"
                      (click)="cellSelect.emit(selectedKey() === key(r.id, cell.columnId) ? undefined : key(r.id, cell.columnId))"
                    >
                      <span class="sr-only">{{ prefix(r.label, cell) }}</span>
                      <svg mkIcon [name]="look(cell).icon" [size]="14"></svg>
                      <span>{{ cell.label ?? look(cell).word }}</span>
                      @if (cell.duration) {
                        <span class="matrix-ms">{{ cell.duration }}</span>
                      }
                    </button>
                  } @else {
                    <span class="matrix-cell">
                      <svg mkIcon [name]="look(cell).icon" [size]="14"></svg>
                      <span>{{ cell.label ?? look(cell).word }}</span>
                      @if (finished(cell) && cell.duration) {
                        <span class="matrix-ms">{{ cell.duration }}</span>
                      }
                    </span>
                  }
                </td>
              }
            </tr>
          }
        </tbody>
      }
      @if (footer(); as f) {
        <tfoot>
          <tr>
            <th scope="row">{{ f.label }}</th>
            @for (c of f.cells; track $index) {
              <td [attr.data-tone]="c.tone ?? null">{{ c.text }}</td>
            }
          </tr>
        </tfoot>
      }
    </table>
  `,
})
export class ConformanceMatrixComponent {
  /** Accessible name of the table. */
  readonly caption = input.required<string>();
  readonly columns = input.required<MatrixColumn[]>();
  readonly groups = input.required<MatrixGroup[]>();
  /** Summary row, one cell per column ("Conversations passed"). */
  readonly footer = input<{ label: string; cells: MatrixFooterCell[] }>();
  /** Key of the selected cell, see `cellKey`. */
  readonly selectedKey = input<string>();
  /** Finished cells become buttons that emit `cellSelect` (`undefined` when the selected cell is pressed again). */
  readonly selectable = input(false);
  readonly cellSelect = output<string | undefined>();

  protected key(rowId: string, columnId?: string): string {
    return cellKey(rowId, columnId);
  }
  protected look(cell: MatrixCell) {
    return RESULT[cell.result];
  }
  protected finished(cell: MatrixCell): boolean {
    return cell.result === 'pass' || cell.result === 'fail' || cell.result === 'warn';
  }
  protected prefix(rowLabel: string, cell: MatrixCell): string {
    const col = this.columns().find((c) => c.id === cell.columnId);
    return `${col ? `${col.label} × ` : ''}${rowLabel}: `;
  }
}
