import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { copyText } from '../../utils/clipboard';

type Snippet = 'url' | 'curl' | 'httpie' | 'mcp';

/** The live endpoint of a mock, one click from the clipboard, with snippet tabs. */
@Component({
  tag: 'mk-mock-url',
  shadow: true,
  styles: `
    :host { display: block; }
    .tabs { display: flex; gap: var(--space-4); margin-bottom: var(--space-2); }
    .tabs button { all: unset; cursor: pointer; font: 400 13px/18px var(--font-ui); color: var(--text-muted); padding-bottom: 6px; border-bottom: 2px solid transparent; }
    .tabs button[aria-selected="true"] { color: var(--text); font-weight: 600; border-bottom-color: var(--action); }
    .tabs button:focus-visible { box-shadow: var(--shadow-focus); }
    .box { display: flex; align-items: center; gap: var(--space-3); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-panel); padding: 10px 12px; }
    code { flex: 1; min-width: 0; font: var(--type-code); color: var(--link); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    button.copy { all: unset; box-sizing: border-box; cursor: pointer; font: 600 13px/18px var(--font-ui); height: 32px; padding: 0 12px; display: inline-flex; align-items: center; border-radius: var(--radius-control); border: 1px solid var(--border-strong); background: var(--canvas); color: var(--text); }
    button.copy:focus-visible { border-color: var(--action); box-shadow: var(--shadow-focus); }
    button.copy.done { color: var(--success); border-color: var(--success); }
  `,
})
export class MkMockUrl {
  /** Mock endpoint URL. */
  @Prop() url!: string;
  @Prop() method = 'GET';
  /** MCP tool name; enables the "MCP tool" tab for agent-ready services. */
  @Prop() mcpTool?: string;
  /** Hide snippet tabs and show the bare URL. */
  @Prop() bare = false;

  @State() tab: Snippet = 'curl';
  @State() copied = false;

  /** Emitted after a successful copy, with the copied text. */
  @Event() mkCopy!: EventEmitter<string>;

  private snippet(): string {
    switch (this.bare ? 'url' : this.tab) {
      case 'url':
        return this.url;
      case 'httpie':
        return `http ${this.method} ${this.url}`;
      case 'mcp':
        return JSON.stringify({ tool: this.mcpTool, arguments: {} });
      default:
        return this.method === 'GET' ? `curl ${this.url}` : `curl -X ${this.method} ${this.url}`;
    }
  }

  private async copy() {
    const text = this.snippet();
    if (await copyText(text)) {
      this.copied = true;
      this.mkCopy.emit(text);
      setTimeout(() => (this.copied = false), 2000);
    }
  }

  render() {
    const tabs: Array<[Snippet, string]> = [
      ['curl', 'curl'],
      ['httpie', 'HTTPie'],
      ...(this.mcpTool ? ([['mcp', 'MCP tool']] as Array<[Snippet, string]>) : []),
    ];
    const text = this.snippet();
    return (
      <Host>
        {!this.bare && (
          <div class="tabs" role="tablist" aria-label="Snippet format">
            {tabs.map(([id, label]) => (
              <button role="tab" aria-selected={String(this.tab === id)} onClick={() => (this.tab = id)}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div class="box">
          <code title={text}>{text}</code>
          <button class={{ copy: true, done: this.copied }} onClick={() => this.copy()} aria-live="polite">
            {this.copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </Host>
    );
  }
}
