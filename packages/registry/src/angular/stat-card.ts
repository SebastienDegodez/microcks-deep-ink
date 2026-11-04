import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

let nextId = 0;

/** A link at the end of the header: `<a mkStatCardAction href="#/services">Catalogue</a>`. */
@Directive({ selector: '[mkStatCardAction]', host: { class: 'stat-card-action' } })
export class StatCardActionDirective {}

/**
 * One key figure: a small heading, a big number with its unit, and optional detail under it.
 * `<section mkStatCard title="APIs & services" value="11" unit="29 operations">…</section>`
 */
@Component({
  selector: 'section[mkStatCard]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'stat-card',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.data-tone]': 'tone()',
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `
    <div class="stat-card-head">
      <div class="stat-card-title" role="heading" [attr.aria-level]="headingLevel()" [id]="titleId">{{ title() }}</div>
      <ng-content select="[mkStatCardAction]" />
    </div>
    <p class="stat-card-figure">
      <span class="stat-card-value">{{ value() }}</span>
      @if (unit()) {<span class="stat-card-unit">{{ unit() }}</span>}
    </p>
    <div class="stat-card-body"><ng-content /></div>
  `,
})
export class StatCardComponent {
  /** Small uppercase heading: "Mock invocations · 7 days". */
  readonly title = input.required<string>();
  /** Level of the title heading. Keep the page outline ordered. */
  readonly headingLevel = input<2 | 3 | 4 | 5 | 6>(2);
  /** The big figure, always written as text: "638", "78%". */
  readonly value = input.required<string | number>();
  /** Text after the figure on the same line: "requests", "29 operations". */
  readonly unit = input<string>();
  /** Colour of the figure. The meaning must also be in the text. */
  readonly tone = input<'neutral' | 'success' | 'warning' | 'danger'>('neutral');

  protected readonly titleId = `mk-stat-title-${++nextId}`;
}

/** Grid of key figures, each card at least 220px wide: `<section mkStatGrid label="Key figures">`. */
@Component({
  selector: 'section[mkStatGrid]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'stat-grid', '[attr.aria-label]': 'label()' },
  template: `<ng-content />`,
})
export class StatGridComponent {
  /** Accessible name of the group: "Key figures". */
  readonly label = input.required<string>();
}

export const STAT_CARD = [StatCardComponent, StatGridComponent, StatCardActionDirective] as const;
