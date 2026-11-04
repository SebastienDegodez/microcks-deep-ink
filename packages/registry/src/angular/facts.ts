import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type FactTone = 'success' | 'warning' | 'danger' | 'muted';

export interface Fact {
  term: string;
  value: string;
  /** Muted 12px line under the value. */
  sub?: string;
  /** Monospace 12px value (ids, paths, versions). */
  mono?: boolean;
  /** Colour of the value. The words must carry the meaning too. */
  tone?: FactTone;
}

/**
 * Key/value facts of an object in a native `<dl>`: `<dl mkFacts [items]="facts"></dl>`.
 * For rich values, project rows after the items: `<div class="facts-row"><dt>Statistics</dt><dd>…</dd></div>`.
 */
@Component({
  selector: 'dl[mkFacts]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'facts',
    '[attr.data-layout]': "layout() === 'rows' ? null : layout()",
    '[attr.data-boxed]': "boxed() === 'surface' ? 'surface' : boxed() ? '' : null",
    '[attr.data-strong]': "strong() ? '' : null",
    '[style.--facts-term]': 'termWidth() ?? null',
    '[style.--facts-gap]': 'gap() ?? null',
    '[style.--facts-cols]': "columns() ? 'repeat(' + columns() + ', minmax(0, 1fr))' : null",
  },
  template: `@for (f of items(); track $index) {<div class="facts-row"><dt>{{ f.term }}</dt><dd [attr.data-mono]="f.mono ? '' : null" [attr.data-tone]="f.tone ?? null">@if (f.sub) {<span>{{ f.value }}</span><span class="facts-sub">{{ f.sub }}</span>} @else {{{ f.value }}}</dd></div>}<ng-content />`,
})
export class FactsComponent {
  readonly items = input<Fact[]>([]);
  /** `rows` (default): term column + separators. `inline`: two-column grid. `columns`: term over value. */
  readonly layout = input<'rows' | 'inline' | 'columns'>('rows');
  /** Frames the list on the page background; `surface`: on the surface fill, padding 12px. */
  readonly boxed = input<boolean | 'surface'>(false);
  /** 14px 600 values (figures). */
  readonly strong = input(false);
  /** Width of the term column: `150px`. */
  readonly termWidth = input<string>();
  /** `columns` only: a fixed number of equal columns. */
  readonly columns = input<number>();
  /** `inline` and `columns`: the grid gap, row then column (default `8px 16px`; WorkflowRun `9px 12px`). */
  readonly gap = input<string>();
}
