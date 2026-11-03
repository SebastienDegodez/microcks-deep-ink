import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, Watch, h } from '@stencil/core';
import { icon } from '../../utils/icons';
import { CommandItem, PROTOCOL_TOKEN, parseJson } from '../../utils/types';

const VERBS = ['test', 'run', 'import', 'copy', 'open', 'create', 'delete'];

/**
 * ⌘K palette mixing navigation and actions. Actions come first when the query contains a verb.
 * Listens to ⌘K / Ctrl K globally unless `global-shortcut` is false.
 */
@Component({
  tag: 'mk-command-bar',
  shadow: true,
  styles: `
    :host { display: contents; }
    .scrim { position: fixed; inset: 0; background: rgba(7, 11, 20, .55); display: flex; justify-content: center; align-items: flex-start; padding-top: 12vh; z-index: 1000; }
    :host([inline]) .scrim { position: static; background: none; padding: 0; display: block; }
    .p { width: min(560px, calc(100vw - 32px)); border: 1px solid var(--border-strong); border-radius: var(--radius-node); background: var(--canvas); box-shadow: var(--shadow-overlay); overflow: hidden; color: var(--text); }
    .q { display: flex; align-items: center; gap: var(--space-3); padding: 14px 16px; border-bottom: 1px solid var(--border); }
    input { all: unset; flex: 1; font: 400 16px/22px var(--font-ui); color: var(--text); }
    input::placeholder { color: var(--text-muted); }
    kbd { font: 400 12px var(--font-mono); color: var(--text-muted); border: 1px solid var(--border); border-radius: var(--radius-control); padding: 1px 6px; }
    ul { list-style: none; margin: 0; padding: 4px 0; max-height: 320px; overflow-y: auto; }
    li { display: flex; align-items: center; gap: var(--space-3); padding: 11px 16px; font: 400 14px/20px var(--font-ui); cursor: pointer; }
    li[aria-selected="true"] { background: var(--raised); }
    .t { font: 600 11px/14px var(--font-mono); color: var(--on-proto); border-radius: var(--radius-control); padding: 3px 6px; min-width: 40px; text-align: center; }
    .t.action { background: var(--action); color: var(--on-action); }
    .t.nav { background: var(--raised); color: var(--text-secondary); }
    .h { margin-left: auto; font: var(--type-small); color: var(--text-muted); }
    .empty { padding: 16px; color: var(--text-muted); font: var(--type-small); }
  `,
})
export class MkCommandBar {
  @Element() el!: HTMLElement;
  private input?: HTMLInputElement;

  @Prop() items: CommandItem[] | string = [];
  @Prop({ mutable: true, reflect: true }) open = false;
  /** Renders in place (no scrim), for docs and embedding. */
  @Prop({ reflect: true }) inline = false;
  @Prop() placeholder = 'Jump to a service, or type an action…';
  @Prop() globalShortcut = true;
  @Prop({ mutable: true }) query = '';

  @State() active = 0;

  /** Emitted when an item is chosen. */
  @Event() mkCommand!: EventEmitter<CommandItem>;
  @Event() mkClose!: EventEmitter<void>;

  @Method()
  async show() {
    this.open = true;
  }

  @Method()
  async hide() {
    this.open = false;
    this.mkClose.emit();
  }

  @Watch('open')
  onOpen(v: boolean) {
    if (v) requestAnimationFrame(() => this.input?.focus());
  }

  @Listen('keydown', { target: 'document' })
  onGlobalKey(e: KeyboardEvent) {
    if (this.globalShortcut && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.open ? this.hide() : this.show();
    }
  }

  private results(): CommandItem[] {
    const all = parseJson<CommandItem[]>(this.items, []);
    const q = this.query.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const hasVerb = words.some((w) => VERBS.includes(w));
    const match = (i: CommandItem) => {
      const hay = [i.label, ...(i.keywords ?? [])].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    };
    const list = all.filter(match);
    if (hasVerb) list.sort((a, b) => Number(b.kind === 'action') - Number(a.kind === 'action'));
    return list;
  }

  private choose(item?: CommandItem) {
    if (!item) return;
    this.mkCommand.emit(item);
    if (!this.inline) this.hide();
  }

  private onKey(e: KeyboardEvent, list: CommandItem[]) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.active = Math.min(this.active + 1, list.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.active = Math.max(this.active - 1, 0);
    } else if (e.key === 'Enter') {
      this.choose(list[this.active]);
    } else if (e.key === 'Escape' && !this.inline) {
      this.hide();
    }
  }

  private tag(i: CommandItem) {
    if (i.kind === 'action') return <span class="t action">{i.kind === 'action' ? 'RUN' : ''}</span>;
    if (i.protocol) return <span class="t" style={{ background: `var(--${PROTOCOL_TOKEN[i.protocol]})` }}>{i.protocol}</span>;
    return <span class="t nav">{i.kind.toUpperCase()}</span>;
  }

  render() {
    if (!this.open && !this.inline) return <Host />;
    const list = this.results();
    const activeId = list[this.active] ? `cmd-${this.active}` : undefined;
    return (
      <Host>
        <div class="scrim" onClick={(e) => e.target === e.currentTarget && this.hide()}>
          <div class="p" role="dialog" aria-modal={this.inline ? undefined : 'true'} aria-label="Command bar">
            <div class="q">
              {icon('search', 18)}
              <input
                ref={(el) => (this.input = el)}
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-activedescendant={activeId}
                placeholder={this.placeholder}
                value={this.query}
                onInput={(e) => {
                  this.query = (e.target as HTMLInputElement).value;
                  this.active = 0;
                }}
                onKeyDown={(e) => this.onKey(e, list)}
              />
              <kbd>⌘K</kbd>
            </div>
            <ul id="cmd-list" role="listbox">
              {list.length === 0 && <li class="empty">No match. Try a service name or "test".</li>}
              {list.map((i, idx) => (
                <li
                  id={`cmd-${idx}`}
                  role="option"
                  aria-selected={String(idx === this.active)}
                  onMouseEnter={() => (this.active = idx)}
                  onClick={() => this.choose(i)}
                >
                  {this.tag(i)}
                  {i.label}
                  <span class="h">{idx === this.active ? 'Enter' : i.hint ?? i.kind}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Host>
    );
  }
}
