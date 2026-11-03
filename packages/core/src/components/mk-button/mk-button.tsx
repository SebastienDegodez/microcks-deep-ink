import { AttachInternals, Component, Element, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { icon } from '../../utils/icons';

/**
 * Sturdy, near-square action. One primary per task region.
 * @slot - Button label.
 * @part button - The native button.
 */
@Component({
  tag: 'mk-button',
  shadow: { delegatesFocus: true },
  formAssociated: true,
  styles: `
    :host { display: inline-block; }
    :host([full-width]) { display: block; }
    button {
      all: unset; box-sizing: border-box; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
      height: 44px; padding: 0 20px; width: 100%;
      font: 500 15px/22px var(--font-ui);
      border-radius: var(--radius-control);
      border: 1px solid transparent;
      transition: background-color .12s ease, border-color .12s ease, color .12s ease;
    }
    :host([size="sm"]) button { height: 32px; padding: 0 12px; font-size: 13px; }
    button:focus-visible { border-color: var(--action); box-shadow: var(--shadow-focus); }
    .primary { background: var(--action); color: var(--on-action); font-weight: 600; }
    .primary:hover { filter: brightness(1.08); }
    .secondary { background: var(--surface); color: var(--text); border-color: var(--border-strong); }
    .secondary:hover { background: var(--raised); }
    .ghost { background: transparent; color: var(--link); padding: 0 12px; }
    .ghost:hover { background: var(--raised); }
    .danger { background: transparent; color: var(--danger); border-color: var(--danger); }
    .danger.confirm { background: var(--danger); color: var(--on-status); }
    button[disabled] { opacity: .45; cursor: not-allowed; filter: none; }
  `,
})
export class MkButton {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Visual variant. */
  @Prop({ reflect: true }) variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'secondary';
  /** 44px for primary actions, 32px for dense toolbars. */
  @Prop({ reflect: true }) size: 'md' | 'sm' = 'md';
  /** Filled danger, only inside a confirmation dialog. */
  @Prop() confirm = false;
  @Prop({ reflect: true }) disabled = false;
  /** Native button type. "submit" and "reset" act on the enclosing form. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';
  /** Optional leading icon (see mk-icon names). */
  @Prop() icon?: string;
  @Prop({ reflect: true, attribute: 'full-width' }) fullWidth = false;

  /** Emitted on activation, unless disabled. */
  @Event() mkClick!: EventEmitter<void>;

  private onClick = (e: MouseEvent) => {
    if (this.disabled) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const form = this.internals?.form;
    if (form && this.type === 'submit') form.requestSubmit();
    if (form && this.type === 'reset') form.reset();
    this.mkClick.emit();
  };

  render() {
    return (
      <Host>
        <button
          part="button"
          type="button"
          class={{ [this.variant]: true, confirm: this.confirm }}
          disabled={this.disabled}
          onClick={this.onClick}
        >
          {this.icon && icon(this.icon, this.size === 'sm' ? 14 : 16)}
          <slot />
        </button>
      </Host>
    );
  }
}
