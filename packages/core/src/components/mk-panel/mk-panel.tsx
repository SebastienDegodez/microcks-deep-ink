import { Component, Host, Prop, h } from '@stencil/core';

/**
 * Panel on `canvas` with a hairline border. Elevation is a lighter ink, never a shadow.
 * @slot - Body.
 * @slot actions - Header actions, right-aligned.
 */
@Component({
  tag: 'mk-panel',
  shadow: true,
  styles: `
    :host { display: block; background: var(--canvas); border: 1px solid var(--border); border-radius: var(--radius-panel); color: var(--text); }
    :host([tone="surface"]) { background: var(--surface); }
    header { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-4) 0; }
    h2 { margin: 0; font: var(--type-title); }
    .sub { font: var(--type-small); color: var(--text-muted); }
    .actions { margin-left: auto; display: flex; gap: var(--space-2); }
    .body { padding: var(--space-4); }
    :host([flush]) .body { padding: 0; }
  `,
})
export class MkPanel {
  @Prop() heading?: string;
  @Prop() subheading?: string;
  @Prop({ reflect: true }) tone: 'canvas' | 'surface' = 'canvas';
  /** Removes body padding, for tables and lists. */
  @Prop({ reflect: true }) flush = false;

  render() {
    return (
      <Host role={this.heading ? 'region' : undefined} aria-label={this.heading}>
        {this.heading && (
          <header>
            <div>
              <h2>{this.heading}</h2>
              {this.subheading && <div class="sub">{this.subheading}</div>}
            </div>
            <div class="actions">
              <slot name="actions" />
            </div>
          </header>
        )}
        <div class="body">
          <slot />
        </div>
      </Host>
    );
  }
}
