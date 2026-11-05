import { booleanAttribute, ChangeDetectionStrategy, Component, contentChildren, Directive, input, model, output, TemplateRef, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from './icon';

let nextId = 0;

export interface SortState {
  key: string;
  direction: 'ascending' | 'descending';
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Keeps the header for assistive technology only (an icon-only "Open" column). */
  headerHidden?: boolean;
  align?: 'start' | 'end';
  mono?: boolean;
  /** Keeps the cells of this column on one line. Cells wrap by default. */
  nowrap?: boolean;
  /** The cells of this column are row headers (`<th scope="row">`) that name their row. */
  rowHeader?: boolean;
  /** Column width (any CSS length: `116px`, `31%`), set on its header. Pair it with `layout="fixed"`. */
  width?: string;
  /** Custom cell text. Defaults to `String(row[key])`. For rich cells use `<ng-template mkCell="key">`. */
  render?: (row: T) => string;
  /** Renders the header as a sort button. */
  sortable?: boolean;
}

/** Context of a `<ng-template mkCell="key" let-row>` cell template. */
export interface CellContext<T> {
  $implicit: T;
}

/** Context of the `rowLinkTemplate` (router links). Spread `href` and `class` on the link you render. */
export interface RowLinkContext<T> {
  $implicit: T;
  href: string;
  class: string;
  current: 'true' | null;
  /** Renders the cell content: `<ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="contentContext" />` inside your link. */
  content: TemplateRef<unknown>;
  contentContext: unknown;
}

/** Rich cell content: `<ng-template mkCell="status" let-row><mk-status-badge …/></ng-template>`. */
@Directive({ selector: 'ng-template[mkCell]' })
export class CellDirective {
  readonly key = input.required<string>({ alias: 'mkCell' });
  readonly template = inject(TemplateRef);
}

/** Sorts a copy of `rows` by `sort`, comparing numbers numerically and anything else as text. */
export function sortRows<T>(rows: readonly T[], sort: SortState | undefined, valueOf?: (row: T, key: string) => unknown): T[] {
  if (!sort) return [...rows];
  const get = valueOf ?? ((row: T, key: string) => (row as Record<string, unknown>)[key]);
  const factor = sort.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = get(a, sort.key);
    const y = get(b, sort.key);
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * factor;
    return String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true }) * factor;
  });
}

/** Styles a plain native table: `<table mkTable density="compact">` with your own `<caption>` and `<th scope>`. */
@Directive({
  selector: 'table[mkTable]',
  host: {
    class: 'table',
    '[attr.data-density]': 'density()',
    '[attr.data-header]': "headerCase() === 'sentence' ? 'sentence' : null",
    '[attr.data-layout]': "layout() === 'fixed' ? 'fixed' : null",
  },
})
export class TableDirective {
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  /** `sentence`: sentence-case 12px headers, top-aligned cells, tabular figures. Row tones: `data-tone="failed | idle"` on a `<tr>`. */
  readonly headerCase = input<'upper' | 'sentence'>('upper');
  /** `fixed`: `table-layout: fixed`, columns take the width of their header; long cell content wraps anywhere. */
  readonly layout = input<'auto' | 'fixed'>('auto');
}

/**
 * Data table: real `<caption>`, `th scope`, `aria-sort`, a focusable scroll region.
 * Nothing in the markup is a clickable `<tr>`.
 */
@Component({
  selector: 'mk-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  styles: [':host { display: block; }'],
  template: `
    <div
      class="table-wrap"
      [attr.role]="scroll() ? 'region' : null"
      [attr.aria-labelledby]="scroll() ? captionId : null"
      [attr.tabindex]="scroll() ? 0 : null"
      [attr.data-scroll]="scroll() ? null : 'false'"
    >
      <table class="table" [attr.data-density]="density()" [attr.data-header]="headerCase() === 'sentence' ? 'sentence' : null" [attr.data-layout]="layout() === 'fixed' ? 'fixed' : null">
        <caption [id]="captionId" [class.sr-only]="captionHidden()">{{ caption() }}</caption>
        <thead>
          <tr>
            @for (c of columns(); track c.key) {
              <th scope="col" [attr.data-align]="c.align === 'end' ? 'end' : null" [attr.aria-sort]="c.sortable ? activeDirection(c.key) : null" [style.width]="c.width ?? null">
                @if (c.sortable) {
                  <button type="button" class="table-sort" (click)="sort.set(nextSort(c.key))">
                    {{ c.header }}
                    <svg mkIcon [name]="sortIcon(c.key)" [size]="12"></svg>
                  </button>
                } @else if (c.headerHidden) {
                  <span class="sr-only">{{ c.header }}</span>
                } @else {
                  {{ c.header }}
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @if (rows().length === 0) {
            <tr>
              <td class="table-empty" [attr.colspan]="columns().length || 1">{{ emptyText() }}</td>
            </tr>
          } @else {
            @for (row of rows(); track keyOf(row)) {
              <tr [attr.data-selected]="isSelected(row) ? '' : null" [attr.data-tone]="rowTone()?.(row) ?? null">
                @for (c of columns(); track c.key; let i = $index) {
                  @if (c.rowHeader) {
                    <th scope="row" [attr.data-align]="c.align === 'end' ? 'end' : null" [attr.data-mono]="c.mono ? '' : null" [attr.data-nowrap]="c.nowrap ? '' : null"><ng-container [ngTemplateOutlet]="body" [ngTemplateOutletContext]="{ $implicit: row, c: c, i: i }" /></th>
                  } @else {
                    <td [attr.data-align]="c.align === 'end' ? 'end' : null" [attr.data-mono]="c.mono ? '' : null" [attr.data-nowrap]="c.nowrap ? '' : null"><ng-container [ngTemplateOutlet]="body" [ngTemplateOutletContext]="{ $implicit: row, c: c, i: i }" /></td>
                  }
                }
              </tr>
            }
          }
        </tbody>
      </table>
      <span role="status" aria-live="polite" class="sr-only">{{ sortMessage() }}</span>
    </div>
    <ng-template #body let-row let-c="c" let-i="i">
                    @if (i === 0 && rowHref()) {
                      @if (rowLinkTemplate(); as link) {
                        <ng-container
                          [ngTemplateOutlet]="link"
                          [ngTemplateOutletContext]="{ $implicit: row, href: rowHref()!(row), class: 'table-rowlink', current: isSelected(row) ? 'true' : null, content: cell, contentContext: { $implicit: row, column: c } }"
                        />
                      } @else {
                        <a class="table-rowlink" [attr.href]="rowHref()!(row)" [attr.aria-current]="isSelected(row) ? 'true' : null">
                          <ng-container [ngTemplateOutlet]="cell" [ngTemplateOutletContext]="{ $implicit: row, column: c }" />
                        </a>
                      }
                    } @else if (c.rowHeader && selectable()) {
                      <button type="button" class="table-pick" [attr.aria-pressed]="isSelected(row)" (click)="rowSelect.emit(row)">
                        <ng-container [ngTemplateOutlet]="cell" [ngTemplateOutletContext]="{ $implicit: row, column: c }" />
                      </button>
                    } @else {
                      @if (i === 0 && isSelected(row)) {
                        <span class="sr-only">Selected: </span>
                      }
                      <ng-container [ngTemplateOutlet]="cell" [ngTemplateOutletContext]="{ $implicit: row, column: c }" />
                    }
                  </ng-template>
    <ng-template #cell let-row let-column="column">
      @if (cellTemplate(column.key); as tpl) {
        <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ $implicit: row }" />
      } @else {
        {{ cellText(row, column) }}
      }
    </ng-template>
  `,
})
export class DataTableComponent<T> {
  /** Visible table title (a real `<caption>`). */
  readonly caption = input.required<string>();
  /** Keeps the caption for assistive technology only. */
  readonly captionHidden = input(false, { transform: booleanAttribute });
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  /** Unique key of a row: a property name or a function. */
  readonly rowKey = input.required<(keyof T & string) | ((row: T) => string)>();
  /** Makes the first cell a link stretched over the whole row. There is no clickable `<tr>`. */
  readonly rowHref = input<(row: T) => string>();
  /** Renders the row link yourself, for router links. See `RowLinkContext`. */
  readonly rowLinkTemplate = input<TemplateRef<RowLinkContext<T>>>();
  readonly selectedKey = input<string>();
  /** Current sort. Activating a sort button updates it; the caller sorts `rows`. */
  readonly sort = model<SortState | undefined>(undefined);
  readonly emptyText = input('Nothing here yet.');
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  /** `upper` (default): uppercase 11px headers. `sentence`: sentence-case 12px headers, top-aligned cells, tabular figures. */
  readonly headerCase = input<'upper' | 'sentence'>('upper');
  /** Tone of a row: `failed` sits on the surface fill, `danger` on the danger tint (an unmet row), `idle` is dimmed with the muted text colour. Write the state in a cell too. */
  readonly rowTone = input<(row: T) => 'failed' | 'danger' | 'idle' | undefined>();
  /** `true` (default): the wrapper is a focusable region that scrolls. `false`: a plain wrapper, no region and no
   * tab stop, for a table that never overflows (usually `layout="fixed"`); overflowing content is clipped. */
  readonly scroll = input(true, { transform: booleanAttribute });
  /** `auto` (default) sizes columns from their content. `fixed`: `table-layout: fixed`, columns take their `width`
   * and long cell content wraps anywhere. */
  readonly layout = input<'auto' | 'fixed'>('auto');
  /** Makes the row header of each row a toggle button (`aria-pressed`, true on `selectedKey`); activating it emits
   * `rowSelect`. Needs a `rowHeader` column; ignored on a cell that holds the row link. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Emits the row whose row header toggle was activated. The caller updates `selectedKey`. */
  readonly rowSelect = output<T>();

  protected readonly captionId = `mk-table-caption-${++nextId}`;
  private readonly cells = contentChildren(CellDirective);

  protected keyOf(row: T): string {
    const k = this.rowKey();
    return typeof k === 'function' ? k(row) : String(row[k]);
  }
  protected isSelected(row: T): boolean {
    const s = this.selectedKey();
    return s !== undefined && this.keyOf(row) === s;
  }
  protected cellTemplate(key: string): TemplateRef<CellContext<T>> | undefined {
    return this.cells().find((c) => c.key() === key)?.template as TemplateRef<CellContext<T>> | undefined;
  }
  protected cellText(row: T, col: DataTableColumn<T>): string {
    if (col.render) return col.render(row);
    const v = (row as Record<string, unknown>)[col.key];
    return v === undefined || v === null ? '' : String(v);
  }
  protected activeDirection(key: string): 'ascending' | 'descending' | null {
    const s = this.sort();
    return s?.key === key ? s.direction : null;
  }
  protected sortIcon(key: string): 'arrow-up' | 'arrow-down' | 'dash' {
    const d = this.activeDirection(key);
    return d === 'descending' ? 'arrow-down' : d === 'ascending' ? 'arrow-up' : 'dash';
  }
  protected nextSort(key: string): SortState {
    const s = this.sort();
    return { key, direction: s?.key === key && s.direction === 'ascending' ? 'descending' : 'ascending' };
  }
  protected sortMessage(): string {
    const s = this.sort();
    const col = s ? this.columns().find((c) => c.key === s.key) : undefined;
    return s && col ? `Sorted by ${col.header}, ${s.direction}` : '';
  }
}
