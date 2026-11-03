import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { getPluginHost } from '@microcks-deep-ink/plugin-sdk';
import { icon } from '../../utils/icons';
import { NavItem, parseJson } from '../../utils/types';
import { DEFAULT_NAV } from '../../utils/nav';



/**
 * Left navigation. Plugin contributions to `nav.items` are appended after the core items,
 * marked with a plugin icon so users know where a screen comes from.
 */
@Component({
  tag: 'mk-side-nav',
  shadow: true,
  styles: `
    :host { display: block; background: var(--canvas); border-right: 1px solid var(--border); height: 100%; box-sizing: border-box; }
    nav { padding: var(--space-3) var(--space-2); display: flex; flex-direction: column; gap: 2px; }
    a { display: flex; align-items: center; gap: var(--space-3); height: 40px; padding: 0 var(--space-3); border-radius: var(--radius-control); color: var(--text-secondary); text-decoration: none; font: 500 14px/20px var(--font-ui); cursor: pointer; }
    a:hover { background: var(--raised); color: var(--text); }
    a:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
    a[aria-current="page"] { background: var(--selected); color: var(--text); font-weight: 600; box-shadow: inset 3px 0 0 var(--action); }
    .badge { margin-left: auto; font: 400 11px var(--font-mono); color: var(--text-muted); }
    .sep { height: 1px; background: var(--border); margin: var(--space-2) var(--space-3); }
    .group { font: var(--type-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--text-muted); padding: var(--space-2) var(--space-3) 4px; }
    :host([collapsed]) .label, :host([collapsed]) .badge, :host([collapsed]) .group { display: none; }
  `,
})
export class MkSideNav {
  /** Core items. Defaults to the Microcks v2 navigation. */
  @Prop() items: NavItem[] | string = DEFAULT_NAV;
  @Prop({ mutable: true, reflect: true }) active = 'services';
  @Prop({ reflect: true }) collapsed = false;
  /** Show items contributed by plugins through the `nav.items` extension point. */
  @Prop() showPluginItems = true;

  @State() pluginItems: NavItem[] = [];

  @Event() mkNavigate!: EventEmitter<NavItem>;

  private unsubscribe?: () => void;

  connectedCallback() {
    const host = getPluginHost();
    const refresh = () =>
      (this.pluginItems = host.contributionsFor('nav.items').map((c) => ({
        id: `${c.pluginId}:${c.id}`,
        label: c.title ?? c.id,
        icon: 'plugin',
        pluginId: c.pluginId,
      })));
    refresh();
    this.unsubscribe = host.subscribe(refresh);
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }

  private link(item: NavItem) {
    return (
      <a
        href={item.href ?? `#${item.id}`}
        aria-current={item.id === this.active ? 'page' : undefined}
        title={this.collapsed ? item.label : undefined}
        onClick={(e) => {
          if (!item.href) e.preventDefault();
          this.active = item.id;
          this.mkNavigate.emit(item);
        }}
      >
        {icon(item.icon ?? 'circle', 18)}
        <span class="label">{item.label}</span>
        {item.badge && <span class="badge">{item.badge}</span>}
      </a>
    );
  }

  render() {
    const core = parseJson<NavItem[]>(this.items, DEFAULT_NAV);
    return (
      <Host>
        <nav aria-label="Main">
          {core.map((i) => this.link(i))}
          {this.showPluginItems && this.pluginItems.length > 0 && [
            <div class="sep" />,
            <div class="group">Plugins</div>,
            ...this.pluginItems.map((i) => this.link(i)),
          ]}
        </nav>
      </Host>
    );
  }
}
