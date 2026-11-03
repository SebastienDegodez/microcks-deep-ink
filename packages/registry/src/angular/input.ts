import { booleanAttribute, Directive, input } from '@angular/core';

/**
 * Native `<input>` or `<textarea>` with the `di-input` styling. Give it a visible label with
 * `<mk-field>` (or a `<label for>`); a placeholder is not a label.
 */
@Directive({
  selector: 'input[mkInput], textarea[mkInput]',
  host: {
    class: 'di-input',
    '[attr.data-mono]': "mono() ? '' : null",
    '[attr.data-size]': 'size()',
  },
})
export class InputDirective {
  /** Monospaced text for paths, URLs and identifiers. */
  readonly mono = input(false, { transform: booleanAttribute });
  readonly size = input<'md' | 'sm'>('md');
}
