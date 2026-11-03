import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, Watch, h } from '@stencil/core';
import { icon } from '../../utils/icons';
import { CommandItem, PROTOCOL_TOKEN, parseJson } from '../../utils/types';

const KINDS: CommandItem['kind'][] = ['action', 'service', 'operation', 'test'];
const KIND_LABEL: Record<CommandItem['kind'], string> = {
  action: 'Actions',
  service: 'Services',
  operation: 'Operations',
  test: 'Tests',
};

let uid = 0;

/** Active element, looking through shadow roots, so focus can return to the real opener. */
function deepActiveElement(): HTMLElement | null {
  let el = document.activeElement as HTMLElement | null;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement as HTMLElement;
  return el;
}

/**
 * Command bar (Ctrl/⌘K): navigation and actions behind one search field.
 * WAI-ARIA 1.2 combobox with a listbox popup (aria-activedescendant keeps DOM focus in the input).
 * Modal mode is a native <dialog> opened with showModal(): focus is trapped, Escape closes,
 * and focus returns to the opener. `inline` renders the same widget in place, for docs and embedding.
 */
@Component({
  tag: 'mk-command-bar',
  shadow: true,
  styles: `
    :host { display: contents; color: var(--text); }
    *, *::before, *::after { box-sizing: border-box; }
    dialog { padding: 0; border: 0; background: transparent; color: inherit; overflow: visible; max-width: none; max-height: none; width: min(560px, calc(100vw - 32px)); margin: 12vh auto auto; }
    dialog::backdrop { background: rgba(7, 11, 20, .6); }
    :host([inline]) .inline { display: block; }
    .p { width: 100%; border: 1px solid var(--border-strong); border-radius: var(--radius-node); background: var(--canvas); box-shadow: var(--shadow-overlay); overflow: hidden; color: var(--text); }
    .q { display: flex; align-items: center; gap: var(--space-3); padding: 6px 8px 6px 16px; border-bottom: 1px solid var(--border); }
    .q svg { flex: none; color: var(--text-secondary); }
    input { flex: 1; min-width: 0; min-height: 44px; border: 0; background: transparent; font: 400 16px/22px var(--font-ui); color: var(--text); }
    input::placeholder { color: var(--text-muted); opacity: 1; }
    input:focus-visible { outline-offset: -2px; }
    input:focus-visible, button:focus-visible { outline: 2px solid var(--action); outline-offset: 2px; box-shadow: var(--shadow-focus); }
    kbd { flex: none; font: 400 12px var(--font-mono); color: var(--text-secondary); border: 1px solid var(--border-control); border-radius: var(--radius-control); padding: 1px 6px; }
    .close { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; color: var(--text); background: transparent; border: 1px solid transparent; border-radius: var(--radius-control); cursor: pointer; }
    .close:hover { background: var(--raised); }
    .list { max-height: 340px; overflow-y: auto; padding: 4px 0; }
    .group { margin: 0; padding: 0; }
    .gh { padding: 8px 16px 2px; font: 600 12px/16px var(--font-ui); letter-spacing: .04em; text-transform: uppercase; color: var(--text-secondary); }
    .opt { display: flex; align-items: center; gap: var(--space-3); min-height: 44px; padding: 8px 16px; font: 400 14px/20px var(--font-ui); cursor: pointer; border-left: 3px solid transparent; }
    .opt[aria-selected="true"] { background: var(--selected); border-left-color: var(--action); }
    .t { flex: none; font: 600 11px/14px var(--font-mono); color: var(--on-proto); border-radius: var(--radius-control); padding: 3px 6px; min-width: 40px; text-align: center; }
    .t.action { background: var(--action); color: var(--on-action); }
    .t.nav { background: var(--raised); color: var(--text-secondary); }
    .h { margin-left: auto; flex: none; font: var(--type-small); color: var(--text-secondary); }
    .empty { padding: 16px; color: var(--text-secondary); font: var(--type-small); }
    .sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  `,
})
export class MkCommandBar {
  private readonly id = `cb-${++uid}`;
  private input?: HTMLInputElement;
  private dialog?: HTMLDialogElement;
  private opener: HTMLElement | null = null;

  @Element() el!: HTMLElement;

  @Prop() items: CommandItem[] | string = [];
  @Prop({ mutable: true, reflect: true }) open = false;
  /** Renders in place (no dialog), for docs and embedding. */
  @Prop({ reflect: true }) inline = false;
  @Prop() placeholder = 'Jump to a service, or type an action…';
  /** Ctrl/⌘K opens the bar from anywhere. */
  @Prop() globalShortcut = true;
  /** Accessible name of the dialog and the search field. */
  @Prop() label = 'Command bar';
  @Prop({ mutable: true }) query = '';

  @State() active = 0;

  /** Emitted when an item is chosen. */
  @Event() mkCommand!: EventEmitter<CommandItem>;
  /** Emitted when the modal closes (Escape, backdrop, close button or after choosing). */
  @Event() mkClose!: EventEmitter<void>;

  @Method()
  async show() {
    this.open = true;
  }

  @Method()
  async hide() {
    this.close();
  }

  @Watch('items')
  onItems() {
    this.active = 0;
  }

  @Listen('keydown', { target: 'document' })
  onGlobalKey(e: KeyboardEvent) {
    if (!this.globalShortcut || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
    e.preventDefault();
    if (this.inline) this.input?.focus();
    else if (this.open) this.close();
    else this.open = true;
  }

  componentDidRender() {
    if (this.inline || !this.dialog) return;
    if (this.open && !this.dialog.open) {
      this.opener = deepActiveElement();
      this.dialog.showModal();
      this.input?.focus();
    } else if (!this.open && this.dialog.open) {
      this.dialog.close();
      this.restoreFocus();
    }
    // Keep the active option visible while moving with the arrow keys.
    this.el.shadowRoot?.getElementById(`${this.id}-o${Math.max(0, this.active)}`)?.scrollIntoView?.({ block: 'nearest' });
  }

  disconnectedCallback() {
    if (this.dialog?.open) this.dialog.close();
  }

  private restoreFocus() {
    const o = this.opener;
    this.opener = null;
    if (o && o.isConnected) o.focus();
  }

  private close() {
    if (this.inline) {
      this.query = '';
      this.active = 0;
      return;
    }
    const wasOpen = this.open;
    this.open = false;
    this.query = '';
    this.active = 0;
    if (wasOpen) this.mkClose.emit();
  }

  /** Results grouped by kind, in display order. Flat index = position in this array. */
  private results(): CommandItem[] {
    const all = parseJson<CommandItem[]>(this.items, []);
    const words = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const match = (i: CommandItem) => {
      const hay = [i.label, ...(i.keywords ?? [])].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    };
    const filtered = all.filter(match);
    return KINDS.flatMap((k) => filtered.filter((i) => i.kind === k));
  }

  private choose(item?: CommandItem) {
    if (!item) return;
    this.mkCommand.emit(item);
    if (!this.inline) this.close();
  }

  private onKey(e: KeyboardEvent, list: CommandItem[]) {
    const last = list.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (last >= 0) this.active = this.active >= last ? 0 : this.active + 1;
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (last >= 0) this.active = this.active <= 0 ? last : this.active - 1;
        break;
      case 'Home':
        if (last >= 0) {
          e.preventDefault();
          this.active = 0;
        }
        break;
      case 'End':
        if (last >= 0) {
          e.preventDefault();
          this.active = last;
        }
        break;
      case 'Enter':
        if (list[Math.min(this.active, last)]) {
          e.preventDefault();
          this.choose(list[Math.min(this.active, last)]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        this.close();
        break;
    }
  }

  private tag(i: CommandItem) {
    if (i.kind === 'action') return <span class="t action">RUN</span>;
    if (i.protocol) return <span class="t" style={{ background: `var(--${PROTOCOL_TOKEN[i.protocol]})` }}>{i.protocol}</span>;
    return <span class="t nav">{i.kind.toUpperCase()}</span>;
  }

  private panel() {
    const list = this.results();
    const cur = Math.max(0, Math.min(this.active, list.length - 1));
    const active = list[cur];
    const listId = `${this.id}-list`;
    const announce = list.length === 0 ? 'No results' : `${list.length} ${list.length === 1 ? 'result' : 'results'}`;
    let flat = 0;
    return (
      <div class="p">
        <div class="q">
          {icon('search', 18)}
          <label class="sr" htmlFor={`${this.id}-input`}>
            {this.label}
          </label>
          <input
            id={`${this.id}-input`}
            ref={(el) => (this.input = el)}
            type="text"
            role="combobox"
            autocomplete="off"
            aria-autocomplete="list"
            aria-expanded={list.length > 0 ? 'true' : 'false'}
            aria-controls={list.length > 0 ? listId : undefined}
            aria-activedescendant={active ? `${this.id}-o${cur}` : undefined}
            aria-keyshortcuts={this.globalShortcut ? 'Control+K Meta+K' : undefined}
            placeholder={this.placeholder}
            value={this.query}
            onInput={(e) => {
              this.query = (e.target as HTMLInputElement).value;
              this.active = 0;
            }}
            onKeyDown={(e) => this.onKey(e, list)}
          />
          {this.globalShortcut && <kbd aria-hidden="true">Ctrl K</kbd>}
          {!this.inline && (
            <button type="button" class="close" aria-label="Close" onClick={() => this.close()}>
              {icon('close', 18)}
            </button>
          )}
        </div>
        {list.length > 0 ? (
          <div class="list" id={listId} role="listbox" aria-label={`${this.label} results`}>
            {KINDS.map((k) => {
              const group = list.filter((i) => i.kind === k);
              if (!group.length) return null;
              return (
                <div class="group" role="group" aria-label={KIND_LABEL[k]}>
                  <div class="gh" aria-hidden="true">
                    {KIND_LABEL[k]}
                  </div>
                  {group.map((i) => {
                    const idx = flat++;
                    const selected = idx === cur;
                    return (
                      <div
                        id={`${this.id}-o${idx}`}
                        class="opt"
                        role="option"
                        aria-selected={selected ? 'true' : 'false'}
                        onMouseMove={() => this.active !== idx && (this.active = idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => this.choose(i)}
                      >
                        {this.tag(i)}
                        <span>{i.label}</span>
                        <span class="h" aria-hidden="true">
                          {selected ? 'Enter' : (i.hint ?? i.kind)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div class="empty">No match. Try a service name or "test".</div>
        )}
        <div class="sr" role="status" aria-live="polite" aria-atomic="true">
          {this.open || this.inline ? announce : ''}
        </div>
      </div>
    );
  }

  render() {
    if (this.inline) {
      return (
        <Host>
          <div class="inline" role="group" aria-label={this.label}>
            {this.panel()}
          </div>
        </Host>
      );
    }
    return (
      <Host>
        <dialog
          ref={(el) => (this.dialog = el)}
          aria-label={this.label}
          onCancel={(e) => {
            e.preventDefault();
            this.close();
          }}
          onClose={() => {
            if (this.open) this.close();
          }}
          onClick={(e) => e.target === e.currentTarget && this.close()}
        >
          {this.open && this.panel()}
        </dialog>
      </Host>
    );
  }
}
