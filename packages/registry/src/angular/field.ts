import { afterEveryRender, booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, inject, input, signal } from '@angular/core';
import { IconComponent } from './icon';

let nextId = 0;

/**
 * Label, control, help and error wired together: `for`/`id`, `aria-describedby`,
 * `aria-invalid` and `required`. Put one native control inside (`mkInput`, `mkSelect`, a textarea):
 *
 * `<mk-field label="Name" help="Shown in the catalogue"><input mkInput /></mk-field>`
 */
@Component({
  selector: 'mk-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'di-field', '[attr.data-invalid]': "error() ? '' : null" },
  template: `
    <label class="di-label" [attr.for]="controlId()">{{ label() }}@if (required()) {<span class="di-required" aria-hidden="true"> *</span>}</label>
    <ng-content />
    @if (help()) {
      <p class="di-help" [id]="helpId">{{ help() }}</p>
    }
    @if (error()) {
      <p class="di-error" [id]="errorId">
        <svg mkIcon name="warning" [size]="16"></svg>
        <span><span class="di-sr-only">Error: </span>{{ error() }}</span>
      </p>
    }
  `,
})
export class FieldComponent {
  /** Visible label. Always rendered. */
  readonly label = input.required<string>();
  readonly help = input<string>();
  /** Error message. Shown with an icon and the word "Error", never color alone. */
  readonly error = input<string>();
  readonly required = input(false, { transform: booleanAttribute });

  private readonly uid = `mk-field-${++nextId}`;
  protected readonly helpId = `${this.uid}-help`;
  protected readonly errorId = `${this.uid}-error`;
  protected readonly controlId = signal(`${this.uid}-control`);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private setInvalid = false;

  constructor() {
    // The control is projected content: link it after every render.
    afterEveryRender(() => this.wire());
  }

  private wire(): void {
    const control = this.host.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
    if (!control) return;
    if (!control.id) control.id = `${this.uid}-control`;
    this.controlId.set(control.id);

    const describedBy = [this.help() ? this.helpId : '', this.error() ? this.errorId : ''].filter(Boolean).join(' ');
    if (describedBy) {
      if (control.getAttribute('aria-describedby') !== describedBy) control.setAttribute('aria-describedby', describedBy);
    } else if (control.hasAttribute('aria-describedby') && [this.helpId, this.errorId].includes(control.getAttribute('aria-describedby') ?? '')) {
      control.removeAttribute('aria-describedby');
    }

    if (this.error()) {
      if (control.getAttribute('aria-invalid') !== 'true') control.setAttribute('aria-invalid', 'true');
      this.setInvalid = true;
    } else if (this.setInvalid) {
      control.removeAttribute('aria-invalid');
      this.setInvalid = false;
    }

    if (this.required() && !control.required) control.required = true;
  }
}
