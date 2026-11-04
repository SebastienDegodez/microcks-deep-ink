import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface SummaryStripPart {
  text: string;
  /** `value` (default): mono --text-secondary. `label`: muted sans. */
  kind?: 'value' | 'label';
  /** Draws a separator before this part. */
  sep?: boolean;
}

/**
 * Key facts in one bordered row: `<div mkSummaryStrip role="note" aria-label="Saved behaviour" [parts]="parts"></div>`.
 * Free content projected after the parts (links, a code box).
 */
@Component({
  selector: 'div[mkSummaryStrip]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'summary-strip',
    '[attr.data-gap]': "gap() === 'roomy' ? 'roomy' : null",
    '[attr.data-values]': "values() === 'text' ? 'text' : null",
  },
  template: `@for (p of parts(); track $index) {@if (p.sep) {<span class="summary-strip-sep" aria-hidden="true"></span>}<span [class]="p.kind === 'label' ? 'summary-strip-label' : 'summary-strip-value'">{{ p.text }}</span>}<ng-content />`,
})
export class SummaryStripComponent {
  readonly parts = input<SummaryStripPart[]>([]);
  /** `roomy`: 10px between wrapped rows (Service, Agent). */
  readonly gap = input<'normal' | 'roomy'>('normal');
  /** `text`: values in --text instead of --text-secondary (Service). */
  readonly values = input<'secondary' | 'text'>('secondary');
}

/** A decorative 1 x 16px separator, for strips built from projected content: `<span mkSummaryStripSep></span>`. */
@Component({
  selector: 'span[mkSummaryStripSep]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'summary-strip-sep', 'aria-hidden': 'true' },
  template: ``,
})
export class SummaryStripSepComponent {}

export const SUMMARY_STRIP = [SummaryStripComponent, SummaryStripSepComponent] as const;
