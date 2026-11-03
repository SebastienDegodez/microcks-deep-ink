import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';
import { ExtensionPointId, RegisteredContribution, SlotContext, getPluginHost } from '@microcks-deep-ink/plugin-sdk';

/**
 * Extension point. Renders every plugin contribution registered for `point`
 * as its custom element, and hands it the `context` object as a property.
 * @slot - Fallback shown when no plugin contributes.
 */
@Component({
  tag: 'mk-plugin-slot',
  shadow: true,
  styles: `
    :host { display: contents; }
    .item { display: block; position: relative; }
    :host([outlined]) .item { border: 1px dashed var(--border-strong); border-radius: var(--radius-panel); padding: var(--space-3); }
    .src { font: 400 11px/14px var(--font-mono); color: var(--text-muted); margin-bottom: 6px; }
    .missing { font: var(--type-small); color: var(--warning); }
  `,
})
export class MkPluginSlot {
  @Element() el!: HTMLElement;

  /** Extension point id, e.g. "service.tabs". */
  @Prop() point!: ExtensionPointId;
  /** Context handed to contributed elements (service, operation, theme…). */
  @Prop() context: SlotContext | string = { theme: 'dark' };
  /** Shows each contribution's origin in a dashed frame. Useful in docs and dev mode. */
  @Prop({ reflect: true }) outlined = false;

  @State() items: RegisteredContribution[] = [];

  private unsubscribe?: () => void;

  private ctx(): SlotContext {
    return typeof this.context === 'string' ? JSON.parse(this.context) : this.context;
  }

  connectedCallback() {
    const host = getPluginHost();
    const refresh = () => (this.items = host.contributionsFor(this.point, this.ctx()));
    refresh();
    this.unsubscribe = host.subscribe(refresh);
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  @Watch('point')
  @Watch('context')
  onChange() {
    this.items = getPluginHost().contributionsFor(this.point, this.ctx());
  }

  componentDidRender() {
    const ctx = this.ctx();
    this.el.shadowRoot?.querySelectorAll('[data-contribution]').forEach((node) => {
      (node as HTMLElement & { context?: SlotContext }).context = ctx;
    });
  }

  render() {
    if (this.items.length === 0) {
      return (
        <Host>
          <slot />
        </Host>
      );
    }
    return (
      <Host>
        {this.items.map((c) => {
          const Tag = c.element as any;
          const defined = typeof customElements === 'undefined' || !!customElements.get(c.element);
          return (
            <div class="item" key={`${c.pluginId}:${c.id}`}>
              {this.outlined && (
                <div class="src">
                  {c.pluginId} → {this.point}
                </div>
              )}
              {defined ? <Tag data-contribution {...(c.attributes ?? {})} /> : <div class="missing">&lt;{c.element}&gt; is not defined yet</div>}
            </div>
          );
        })}
      </Host>
    );
  }
}
