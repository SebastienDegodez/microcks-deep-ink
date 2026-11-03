import { booleanAttribute, ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent } from './icon';

let nextId = 0;
const uid = (prefix: string) => `${prefix}-${++nextId}`;

/** Native checkbox inside its label: `<mk-checkbox label="Notify me" [(checked)]="notify" />`. */
@Component({
  selector: 'mk-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <label class="di-choice">
      <input
        type="checkbox"
        class="di-checkbox"
        [checked]="checked()"
        [disabled]="disabled()"
        [required]="required()"
        [attr.name]="name() || null"
        [attr.value]="value() ?? null"
        [attr.aria-labelledby]="labelId"
        [attr.aria-describedby]="description() ? descId : null"
        (change)="checked.set($any($event.target).checked)"
      />
      <span>
        <span class="di-choice-label" [id]="labelId">{{ label() }}</span>
        @if (description()) {
          <span class="di-choice-description" [id]="descId">{{ description() }}</span>
        }
      </span>
    </label>
  `,
})
export class CheckboxComponent {
  /** Visible label. */
  readonly label = input.required<string>();
  /** Secondary text, linked with aria-describedby. */
  readonly description = input<string>();
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly value = input<string>();

  protected readonly labelId = uid('mk-checkbox-label');
  protected readonly descId = uid('mk-checkbox-desc');
}

/** Native radio inside its label. Use `<fieldset mkRadioGroup>` to group several. */
@Component({
  selector: 'mk-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <label class="di-choice">
      <input
        type="radio"
        class="di-radio"
        [checked]="checked()"
        [disabled]="disabled()"
        [required]="required()"
        [attr.name]="name() || null"
        [attr.value]="value() ?? null"
        [attr.aria-labelledby]="labelId"
        [attr.aria-describedby]="description() ? descId : null"
        (change)="checked.set($any($event.target).checked)"
      />
      <span>
        <span class="di-choice-label" [id]="labelId">{{ label() }}</span>
        @if (description()) {
          <span class="di-choice-description" [id]="descId">{{ description() }}</span>
        }
      </span>
    </label>
  `,
})
export class RadioComponent {
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input<string>();
  readonly value = input<string>();

  protected readonly labelId = uid('mk-radio-label');
  protected readonly descId = uid('mk-radio-desc');
}

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * `fieldset` + `legend` + native radios. Arrow keys move the selection (native behavior).
 * `<fieldset mkRadioGroup legend="Mode" [options]="options" [(value)]="mode"></fieldset>`
 */
@Component({
  selector: 'fieldset[mkRadioGroup]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RadioComponent, IconComponent],
  host: {
    class: 'di-fieldset',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-invalid]': "error() ? 'true' : null",
    '[attr.data-invalid]': "error() ? '' : null",
  },
  template: `
    <legend>{{ legend() }}@if (required()) {<span class="di-required" aria-hidden="true"> *</span>}</legend>
    @for (o of options(); track o.value) {
      <mk-radio
        [name]="groupName()"
        [value]="o.value"
        [label]="o.label"
        [description]="o.description"
        [disabled]="!!o.disabled"
        [required]="required()"
        [checked]="value() === o.value"
        (checkedChange)="value.set(o.value)"
      />
    }
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
export class RadioGroupComponent {
  /** Visible group name, rendered as the fieldset legend. */
  readonly legend = input.required<string>();
  readonly options = input.required<RadioOption[]>();
  readonly value = model<string | undefined>(undefined);
  /** Shared name of the radios. Generated when omitted. */
  readonly name = input<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly help = input<string>();
  readonly error = input<string>();

  private readonly uid = uid('mk-radio-group');
  protected readonly helpId = `${this.uid}-help`;
  protected readonly errorId = `${this.uid}-error`;
  protected groupName(): string {
    return this.name() ?? `${this.uid}-name`;
  }
  protected describedBy(): string | null {
    return [this.help() ? this.helpId : '', this.error() ? this.errorId : ''].filter(Boolean).join(' ') || null;
  }
}
