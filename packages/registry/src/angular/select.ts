import { Directive, input } from '@angular/core';

/**
 * Native `<select>`. The browser provides the keyboard behavior and the picker.
 * Give it a visible label with `<mk-field>` (or a `<label for>`).
 */
@Directive({
  selector: 'select[mkSelect]',
  host: { class: 'di-select', '[attr.data-size]': 'size()' },
})
export class SelectDirective {
  readonly size = input<'md' | 'sm'>('md');
}
