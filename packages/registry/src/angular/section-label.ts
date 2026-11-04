import { Directive, input } from '@angular/core';

/**
 * Small uppercase muted label. Put it on the right native element:
 * `<h3 mkSectionLabel>Endpoints</h3>`, `<label mkSectionLabel for="mock-url">Mock URL</label>`,
 * `<span mkSectionLabel size="sm">3 operations</span>`. The text stays in normal case; CSS sets the case.
 */
@Directive({
  selector: '[mkSectionLabel]',
  host: {
    class: 'section-label',
    '[attr.data-size]': "size() === 'md' ? null : size()",
    '[attr.data-weight]': "weight() === 'semibold' ? null : weight()",
    '[attr.data-split]': "split() ? '' : null",
  },
})
export class SectionLabelDirective {
  /** `md` (default): 12px, tracking .04em. `sm`: 11px, tracking .06em. */
  readonly size = input<'md' | 'sm'>('md');
  /** `regular`: weight 400 instead of 600. */
  readonly weight = input<'semibold' | 'regular'>('semibold');
  /** Spreads the children to both ends of the line. */
  readonly split = input(false);
}
