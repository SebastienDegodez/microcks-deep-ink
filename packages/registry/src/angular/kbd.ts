import { Directive } from '@angular/core';

/** Keyboard key cap: `<kbd mkKbd>Ctrl</kbd>`. */
@Directive({ selector: 'kbd[mkKbd]', host: { class: 'di-kbd' } })
export class KbdDirective {}
