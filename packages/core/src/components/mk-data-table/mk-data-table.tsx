import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { TableColumn, parseJson } from '../../utils/types';

/**
 * Dense workbench table. Wide tables scroll inside their box.
 * Cells are plain text; use `mono` columns for paths and identifiers.
 */
@Component({
  tag: 'mk-data-table',
  shadow: true,
  styles: `
    :host { display: block; border: 1px solid var(--border); border-radius: var(--radius-panel); background: var(--canvas); overflow: hidden; }
    .scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font: var(--type-small); font-size: 14px; color: var(--text); }
    caption { text-align: start; padding: var(--space-3) var(--space-4); font: var(--type-heading); }
    th { font: var(--type-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--text-muted); text-align: start; padding: 10px var(--space-4); border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--canvas); }
    td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border); white-space: nowrap; }
    tr:last-child td { border-bottom: none; }
    tbody tr { cursor: default; }
    :host([interactive]) tbody tr { cursor: pointer; }
    :host([interactive]) tbody tr:hover { background: var(--raised); }
    tbody tr:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--action); }
    tr[aria-selected="true"] { background: var(--selected); }
    .end { text-align: end; }
    .mono { font: var(--type-code); }
    .empty { padding: var(--space-12); text-align: center; color: var(--text-muted); }
  `,
})
export class MkDataTable {
  @Prop() columns: TableColumn[] | string = [];
  @Prop() rows: Array<Record<string, unknown>> | string = [];
  @Prop() caption?: string;
  /** Rows are clickable and emit mkRowClick. */
  @Prop({ reflect: true }) interactive = false;
  /** Key of the selected row, matched against `rowKey`. */
  @Prop() selectedKey?: string;
  @Prop() rowKey = 'id';
  @Prop() emptyText = 'Nothing here yet.';

  @Event() mkRowClick!: EventEmitter<Record<string, unknown>>;

  render() {
    const cols = parseJson<TableColumn[]>(this.columns, []);
    const rows = parseJson<Array<Record<string, unknown>>>(this.rows, []);
    return (
      <Host>
        <div class="scroll">
          <table>
            {this.caption && <caption>{this.caption}</caption>}
            <thead>
              <tr>
                {cols.map((c) => (
                  <th scope="col" class={{ end: c.align === 'end' }} style={c.width ? { width: c.width } : {}}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td class="empty" colSpan={cols.length}>
                    {this.emptyText}
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  tabIndex={this.interactive ? 0 : undefined}
                  aria-selected={this.selectedKey !== undefined ? String(String(r[this.rowKey]) === this.selectedKey) : undefined}
                  onClick={() => this.interactive && this.mkRowClick.emit(r)}
                  onKeyDown={(e) => this.interactive && e.key === 'Enter' && this.mkRowClick.emit(r)}
                >
                  {cols.map((c) => (
                    <td class={{ end: c.align === 'end', mono: !!c.mono }}>{String(r[c.key] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
