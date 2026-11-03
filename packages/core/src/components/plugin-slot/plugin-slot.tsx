import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';
import { ExtensionPointId, RegisteredContribution, SlotContext, getPluginHost } from '@microcks-deep-ink/plugin-sdk';

/**
 * Extension point. Renders every plugin contribution registered for `point` as its custom element
 * and hands it the `context` object as a property.
 *
 * Renders in the light DOM (scoped styles, no shadow root): global tokens and the `*` classes
 * reach the contributed elements. Each contribution is wrapped in
 * `<div class="plugin-item" data-plugin-id="...">`.
 * @slot - Fallback shown when no plugin contributes.
 */
@Component({
  tag: 'plugin-slot',
  scoped: true,
  styles: `
    :host { display: contents; }
    .plugin-item { display: block; position: relative; }
    :host([outlined]) .plugin-item { border: 1px dashed var(--border-control); border-radius: var(--radius-panel); padding: var(--space-3); }
    .plugin-source { font: 400 12px/16px var(--font-mono); color: var(--text-secondary); margin-bottom: 6px; }
    .plugin-missing { font: var(--type-small); color: var(--warning); }
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

  private refresh = () => {
    this.items = getPluginHost().contributionsFor(this.point, this.ctx());
  };

  connectedCallback() {
    const host = getPluginHost();
    this.refresh();
    this.unsubscribe = host.subscribe(this.refresh);
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  @Watch('point')
  @Watch('context')
  onChange() {
    this.refresh();
  }

  componentDidRender() {
    const ctx = this.ctx();
    this.el.querySelectorAll('.plugin-item > [data-contribution]').forEach((node) => {
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
            <div class="plugin-item" data-plugin-id={c.pluginId} key={`${c.pluginId}:${c.id}`}>
              {this.outlined && (
                <div class="plugin-source">
                  {c.pluginId} → {this.point}
                </div>
              )}
              {defined ? (
                <Tag data-contribution {...(c.attributes ?? {})} />
              ) : (
                <div class="plugin-missing">&lt;{c.element}&gt; is not defined yet</div>
              )}
            </div>
          );
        })}
      </Host>
    );
  }
}
