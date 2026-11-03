import { booleanAttribute, ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let nextId = 0;

/**
 * A native checkbox with `role="switch"`. Space toggles it; the state is announced as on or off.
 * Name what the switch controls, not its state: `<mk-switch label="Auto-refresh" [(checked)]="on" />`.
 */
@Component({
  selector: 'mk-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <label class="di-choice">
      <input
        type="checkbox"
        role="switch"
        class="di-switch"
        [checked]="checked()"
        [attr.aria-checked]="checked()"
        [disabled]="disabled()"
        [attr.name]="name() || null"
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
export class SwitchComponent {
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly name = input<string>();

  private readonly uid = `mk-switch-${++nextId}`;
  protected readonly labelId = `${this.uid}-label`;
  protected readonly descId = `${this.uid}-desc`;
}
