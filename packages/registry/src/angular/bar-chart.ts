import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, output } from '@angular/core';

export type BarTone = 'action' | 'success' | 'danger' | 'warning' | 'running';

export interface BarChartBar {
  id: string;
  value: number;
  /** Full accessible name: "Run #118, failed, 1.84 s, 6/7 samples passed". */
  description: string;
  /** X label under the bar; empty to skip it. */
  label?: string;
  tone?: BarTone;
  /** A slot still to come: a dashed frame, not selectable. */
  future?: boolean;
  /** Dimmed (outside the filters); stays selectable. */
  faded?: boolean;
  /** Text above the bar (a capped value: "12 s"). */
  cap?: string;
}

export interface BarChartTable {
  caption: string;
  columns: string[];
  /** One row per bar; the first cell is the row header. */
  rows: string[][];
}

/**
 * Selectable bar chart: `<mk-bar-chart label="…" [bars]="bars" [max]="3000" [selectedId]="id" (select)="id = $event" [table]="table" />`.
 * One button per bar, one tab stop, arrow keys, and a visually hidden table. Project a decorative overlay with `[mkBarChartOverlay]`.
 */
@Component({
  selector: 'mk-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block' },
  template: `
    <div class="bar-chart" [attr.data-selection]="selection()" [style.--bar-chart-height]="height() ? height() + 'px' : null" [style.--bar-chart-gap]="gap() !== undefined ? gap() + 'px' : null">
      @if (ticks(); as t) {<div class="bar-chart-axis" aria-hidden="true">@for (x of t; track $index) {<span>{{ x }}</span>}</div>}
      <div class="bar-chart-main">
        <div class="bar-chart-plot">
          @for (g of grid(); track g) {<div class="bar-chart-grid" aria-hidden="true" [style.top.%]="g * 100"></div>}
          <div class="bar-chart-bars" role="group" [attr.aria-label]="label()">
            @for (b of bars(); track b.id; let i = $index) {
              @if (b.future) {
                <div class="bar-chart-cell" aria-hidden="true"><span class="bar-chart-future"></span></div>
              } @else {
                <div class="bar-chart-cell" [attr.data-faded]="b.faded ? '' : null">
                  @if (b.cap) {<span class="bar-chart-cap" aria-hidden="true" [style.bottom]="'calc(' + pct(b) + '% + 2px)'">{{ b.cap }}</span>}
                  <button type="button" class="bar-chart-bar" [attr.data-index]="i" [attr.aria-pressed]="i === selIndex()" [attr.aria-label]="b.description" [attr.tabindex]="i === tabStop() ? 0 : -1" (click)="select.emit(b.id)" (keydown)="onKey($event, i)">
                    <span class="bar-chart-fill" [attr.data-tone]="b.tone && b.tone !== 'action' ? b.tone : null" [style.height.%]="pct(b)"></span>
                  </button>
                </div>
              }
            }
          </div>
          <div class="bar-chart-overlay" aria-hidden="true"><ng-content select="[mkBarChartOverlay]" /></div>
        </div>
        <div class="bar-chart-labels" aria-hidden="true">
          @for (b of bars(); track b.id; let i = $index) {<span [attr.data-selected]="i === selIndex() ? '' : null">{{ b.label ?? '' }}</span>}
        </div>
      </div>
      @if (ticksEnd(); as t) {<div class="bar-chart-axis" data-side="end" aria-hidden="true">@for (x of t; track $index) {<span>{{ x }}</span>}</div>}
    </div>
    <table class="sr-only">
      <caption>{{ table().caption }}</caption>
      <thead><tr>@for (c of table().columns; track c) {<th scope="col">{{ c }}</th>}</tr></thead>
      <tbody>
        @for (r of table().rows; track $index) {
          <tr>@for (cell of r; track $index; let j = $index) {@if (j === 0) {<th scope="row">{{ cell }}</th>} @else {<td>{{ cell }}</td>}}</tr>
        }
      </tbody>
    </table>
  `,
})
export class BarChartComponent {
  /** Name of the bar group, with how to move. */
  readonly label = input.required<string>();
  readonly bars = input.required<BarChartBar[]>();
  /** Value of a full-height bar. */
  readonly max = input.required<number>();
  readonly selectedId = input<string>();
  /** `outline` (default): the selected bar is outlined. `fill`: it takes the --link fill. */
  readonly selection = input<'outline' | 'fill'>('outline');
  /** Left axis labels, top to bottom. */
  readonly ticks = input<string[]>();
  /** Right axis labels, top to bottom, in --link. */
  readonly ticksEnd = input<string[]>();
  /** Dashed gridlines, as fractions from the top. */
  readonly grid = input<number[]>([0, 0.5]);
  /** Plot height in px (160). */
  readonly height = input<number>();
  /** Gap between bars in px (4). */
  readonly gap = input<number>();
  /** Smallest visible bar, in %. */
  readonly minHeight = input(2);
  /** The text equivalent, rendered as a visually hidden table. */
  readonly table = input.required<BarChartTable>();
  readonly select = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly selectable = computed(() => this.bars().map((b, i) => (b.future ? -1 : i)).filter((i) => i >= 0));
  protected readonly selIndex = computed(() => this.bars().findIndex((b) => b.id === this.selectedId() && !b.future));
  protected readonly tabStop = computed(() => {
    const s = this.selIndex();
    const all = this.selectable();
    return s >= 0 ? s : (all[all.length - 1] ?? -1);
  });

  protected pct(b: BarChartBar): number {
    const max = this.max();
    return max <= 0 ? 0 : Math.min(100, Math.max(b.value > 0 ? this.minHeight() : 0, (b.value / max) * 100));
  }

  protected onKey(e: KeyboardEvent, index: number): void {
    const all = this.selectable();
    const pos = all.indexOf(index);
    const to =
      e.key === 'ArrowRight' ? all[Math.min(pos + 1, all.length - 1)]
      : e.key === 'ArrowLeft' ? all[Math.max(pos - 1, 0)]
      : e.key === 'Home' ? all[0]
      : e.key === 'End' ? all[all.length - 1]
      : undefined;
    if (to === undefined) return;
    e.preventDefault();
    const bar = this.bars()[to];
    if (bar) this.select.emit(bar.id);
    this.host.querySelector<HTMLButtonElement>(`.bar-chart-bar[data-index="${to}"]`)?.focus();
  }
}
