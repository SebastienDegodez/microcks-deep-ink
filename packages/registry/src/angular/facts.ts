import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

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
 * For rich values, project `FactRow`s after the items: `<div mkFactRow term="Statistics">…</div>`.
 */
@Component({
  selector: 'dl[mkFacts]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'facts',
    '[attr.data-layout]': "layout() === 'rows' ? null : layout()",
    '[attr.data-boxed]': "boxed() === 'surface' ? 'surface' : boxed() ? '' : null",
    '[attr.data-strong]': "strong() ? '' : null",
    '[attr.data-size]': "size() === 'md' ? null : size()",
    '[attr.data-values]': "values() === 'text' ? null : values()",
    '[attr.data-line-height]': "lineHeight() === 'inherit' ? null : lineHeight()",
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
  /** `sm`: 11px terms with a normal line height (Traces, Usage). `md` (default). `lg`: 14px text, 8px rows, 14px mono values (Service). */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** `inline` and `columns`: the grid gap, row then column (default `8px 16px`; WorkflowRun `9px 12px`). */
  readonly gap = input<string>();
  /** `secondary`: values in --text-secondary, and the `muted` tone drops to --text-muted (Agent test cell facts). Default `text`. */
  readonly values = input<'text' | 'secondary'>('text');
  /** `relaxed`: values at line height 1.6 (Agent test cell facts). Default `inherit`. */
  readonly lineHeight = input<'inherit' | 'relaxed'>('inherit');
}

/** One term/value pair, for rich values (links, badges, buttons): `<div mkFactRow term="Statistics" mono>…</div>`. */
@Component({
  selector: 'div[mkFactRow]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: { class: 'facts-row' },
  template: `<ng-template #value><ng-content /></ng-template><dt>{{ term() }}</dt><dd [attr.data-mono]="mono() ? '' : null" [attr.data-tone]="tone() ?? null">@if (sub()) {<span><ng-container [ngTemplateOutlet]="value" /></span><span class="facts-sub">{{ sub() }}</span>} @else {<ng-container [ngTemplateOutlet]="value" />}</dd>`,
})
export class FactRowComponent {
  readonly term = input.required<string>();
  /** Muted 12px line under the value. */
  readonly sub = input<string>();
  /** Monospace 12px value (ids, paths, versions). */
  readonly mono = input(false, { transform: booleanAttribute });
  /** Colour of the value. The words must carry the meaning too. */
  readonly tone = input<FactTone>();
}

export const FACTS = [FactsComponent, FactRowComponent] as const;
