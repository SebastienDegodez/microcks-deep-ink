import { AttachInternals, Component, Event, EventEmitter, Host, Prop, Watch, h } from '@stencil/core';

let uid = 0;

/**
 * Labelled text field, form-associated. `mono` for paths, URLs and identifiers.
 * @part input - The native input.
 */
@Component({
  tag: 'mk-input',
  shadow: { delegatesFocus: true },
  formAssociated: true,
  styles: `
    :host { display: block; }
    label { display: block; font: var(--type-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
    input {
      box-sizing: border-box; width: 100%; height: 40px; padding: 0 12px;
      font: 400 15px/22px var(--font-ui); color: var(--text);
      background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-control);
      outline: none;
    }
    input.mono { font: var(--type-code); }
    input::placeholder { color: var(--text-muted); }
    input:focus-visible { border-color: var(--action); box-shadow: var(--shadow-focus); }
    input[aria-invalid="true"] { border-color: var(--danger); }
    .help { font: var(--type-small); color: var(--text-muted); margin-top: 6px; }
    .err { color: var(--danger); }
  `,
})
export class MkInput {
  @AttachInternals() internals!: ElementInternals;
  private id = `mk-input-${++uid}`;

  @Prop() label?: string;
  @Prop({ mutable: true }) value = '';
  @Prop() placeholder?: string;
  @Prop() name?: string;
  @Prop() type: 'text' | 'url' | 'search' | 'email' | 'password' = 'text';
  @Prop() mono = false;
  @Prop() required = false;
  @Prop() disabled = false;
  @Prop() helpText?: string;
  /** Error message; marks the field invalid. */
  @Prop() error?: string;

  /** Emitted on every keystroke with the new value. */
  @Event() mkInput!: EventEmitter<string>;
  /** Emitted when the value is committed (blur or Enter). */
  @Event() mkChange!: EventEmitter<string>;

  @Watch('value')
  syncForm() {
    this.internals?.setFormValue(this.value);
  }

  componentWillLoad() {
    this.syncForm();
  }

  render() {
    const describedBy = this.error || this.helpText ? `${this.id}-help` : undefined;
    return (
      <Host>
        {this.label && <label htmlFor={this.id}>{this.label}</label>}
        <input
          id={this.id}
          part="input"
          class={{ mono: this.mono }}
          type={this.type}
          name={this.name}
          value={this.value}
          placeholder={this.placeholder}
          required={this.required}
          disabled={this.disabled}
          aria-invalid={this.error ? 'true' : undefined}
          aria-describedby={describedBy}
          onInput={(e) => {
            this.value = (e.target as HTMLInputElement).value;
            this.mkInput.emit(this.value);
          }}
          onChange={() => this.mkChange.emit(this.value)}
        />
        {(this.error || this.helpText) && (
          <div id={describedBy} class={{ help: true, err: !!this.error }}>
            {this.error ?? this.helpText}
          </div>
        )}
      </Host>
    );
  }
}
