import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { TabItem, parseJson } from '../../utils/types';

/** Tab strip with an action-colored underline on the active tab. Arrow keys move between tabs. */
@Component({
  tag: 'mk-tabs',
  shadow: true,
  styles: `
    :host { display: block; }
    [role=tablist] { display: flex; gap: var(--space-4); border-bottom: 1px solid var(--border); overflow-x: auto; }
    button {
      all: unset; cursor: pointer; padding: 10px 2px; margin-bottom: -1px;
      font: 500 14px/20px var(--font-ui); color: var(--text-muted);
      border-bottom: 2px solid transparent; white-space: nowrap;
    }
    button:hover { color: var(--text); }
    button[aria-selected="true"] { color: var(--text); font-weight: 600; border-bottom-color: var(--action); }
    button:focus-visible { box-shadow: var(--shadow-focus); border-radius: var(--radius-control); }
    .n { font: 400 12px var(--font-mono); color: var(--text-muted); margin-left: 6px; }
    :host([variant="compact"]) button { font-size: 13px; padding: 6px 2px; }
  `,
})
export class MkTabs {
  /** Tabs, as an array or a JSON string. */
  @Prop() tabs: TabItem[] | string = [];
  /** Active tab id. */
  @Prop({ mutable: true, reflect: true }) value?: string;
  @Prop({ reflect: true }) variant: 'default' | 'compact' = 'default';

  @Event() mkChange!: EventEmitter<string>;

  private select(id: string) {
    this.value = id;
    this.mkChange.emit(id);
  }

  private onKey(e: KeyboardEvent, items: TabItem[], i: number) {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = items[(i + d + items.length) % items.length];
    this.select(next.id);
    const host = (e.target as HTMLElement).parentElement;
    (host?.querySelectorAll('button')[(i + d + items.length) % items.length] as HTMLElement)?.focus();
  }

  render() {
    const items = parseJson<TabItem[]>(this.tabs, []);
    const active = this.value ?? items[0]?.id;
    return (
      <Host>
        <div role="tablist">
          {items.map((t, i) => (
            <button
              role="tab"
              aria-selected={String(t.id === active)}
              tabIndex={t.id === active ? 0 : -1}
              onClick={() => this.select(t.id)}
              onKeyDown={(e) => this.onKey(e, items, i)}
            >
              {t.label}
              {t.count !== undefined && <span class="n">{t.count}</span>}
            </button>
          ))}
        </div>
      </Host>
    );
  }
}
