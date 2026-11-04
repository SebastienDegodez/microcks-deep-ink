import { booleanAttribute, Directive, input } from '@angular/core';

/**
 * Native `<input>` or `<textarea>` with the `input` styling. Give it a visible label with
 * `<mk-field>` (or a `<label for>`); a placeholder is not a label.
 */
@Directive({
  selector: 'input[mkInput], textarea[mkInput]',
  host: {
    class: 'input',
    '[attr.data-mono]': "mono() ? '' : null",
    '[attr.data-size]': 'size()',
    '[attr.data-surface]': "surface() === 'bg' ? 'bg' : null",
  },
})
export class InputDirective {
  /** Monospaced text for paths, URLs and identifiers. */
  readonly mono = input(false, { transform: booleanAttribute });
  readonly size = input<'md' | 'sm'>('md');
  /** `bg`: on the page background instead of the surface (Import). */
  readonly surface = input<'surface' | 'bg'>('surface');
}
