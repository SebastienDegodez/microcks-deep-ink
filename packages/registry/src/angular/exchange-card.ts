import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ExchangeBlock {
  /** Accessible name of the block ("Request line", "Response body"). */
  label: string;
  text: string;
  /** `secondary` (request line), `params` (warning), `headers` (muted), `body` (default, --text). */
  tone?: 'secondary' | 'params' | 'headers' | 'body';
  /** Fills the remaining height of the card. */
  grow?: boolean;
}

/**
 * One side of an exchange: `<section mkExchangeCard title="Response" label="Response of Eclair Cafe" status="200 OK" [blocks]="blocks"></section>`.
 * Put two of them side by side in `<div mkExchange>`.
 */
@Component({
  selector: 'section[mkExchangeCard]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'exchange-card',
    '[attr.aria-label]': 'label()',
    '[attr.data-size]': "size() === 'sm' ? 'sm' : null",
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `
    <div class="exchange-card-head">
      @if (headingLevel() === 'none') {<span class="exchange-card-title">{{ title() }}</span>} @else {<span class="exchange-card-title" role="heading" [attr.aria-level]="headingLevel()">{{ title() }}</span>}
      @if (meta()) {<span class="exchange-card-meta">{{ meta() }}</span>}
      @if (status()) {<span class="exchange-card-status" [attr.data-tone]="statusTone() === 'success' ? null : statusTone()">{{ status() }}</span>}
    </div>
    @for (b of blocks(); track $index) {
      <pre role="region" [attr.aria-label]="b.label" tabindex="0" [attr.data-tone]="b.tone && b.tone !== 'body' ? b.tone : null" [attr.data-grow]="b.grow ? '' : null">{{ b.text }}</pre>
    }
  `,
})
export class ExchangeCardComponent {
  /** Head title, uppercase in CSS: "Request", "Response". */
  readonly title = input.required<string>();
  /** Accessible name of the card: "Request of Eclair Cafe". */
  readonly label = input.required<string>();
  /** Mono text at the end of the head (the example name). */
  readonly meta = input<string>();
  /** Filled status at the end of the head: "200 OK". */
  readonly status = input<string>();
  readonly statusTone = input<'success' | 'warning' | 'danger'>('success');
  readonly blocks = input.required<ExchangeBlock[]>();
  /** `md` (default, Service) or `sm` (Copilot compact head). */
  readonly size = input<'md' | 'sm'>('md');
  /** Level of the title heading; `none` renders plain text. */
  readonly headingLevel = input<3 | 4 | 5 | 6 | 'none'>(4);
}

/**
 * A request and its response side by side: `<div mkExchange><section mkExchangeCard mkExchangeRequest …></section><section mkExchangeCard …></section></div>`.
 * Mark the request with `mkExchangeRequest`; the other card is the response. `[separator]="false"` drops the decorative ⇄.
 */
@Component({
  selector: 'div[mkExchange]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'exchange' },
  template: `<ng-content select="[mkExchangeRequest]" />@if (separator()) {<div class="exchange-sep" aria-hidden="true">⇄</div>}<ng-content />`,
})
export class ExchangeComponent {
  /** Draws a decorative ⇄ between the two cards. */
  readonly separator = input(true, { transform: booleanAttribute });
}

export const EXCHANGE_CARD = [ExchangeCardComponent, ExchangeComponent] as const;
