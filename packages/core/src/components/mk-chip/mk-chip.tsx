import { Component, Host, Prop, h } from '@stencil/core';

/**
 * Label chip (pill). For service labels such as `domain=pastry`.
 * @slot - Chip text.
 */
@Component({
  tag: 'mk-chip',
  shadow: true,
  styles: `
    :host { display: inline-flex; }
    span {
      display: inline-flex; align-items: center; gap: 4px;
      font: 400 12px/16px var(--font-mono); color: var(--text-secondary);
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-pill); padding: 2px 10px;
    }
    .k { color: var(--text-muted); }
  `,
})
export class MkChip {
  /** Optional key rendered before the slot, for `key=value` labels. */
  @Prop() labelKey?: string;

  render() {
    return (
      <Host>
        <span>
          {this.labelKey && <span class="k">{this.labelKey}=</span>}
          <slot />
        </span>
      </Host>
    );
  }
}
