import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { Protocol } from '../../utils/types';

/**
 * One operation in a dense list: method tag, path, meta. Selected rows reveal the mock URL.
 * Stack several inside an `mk-panel flush`.
 */
@Component({
  tag: 'mk-operation-row',
  shadow: true,
  styles: `
    :host { display: block; border-bottom: 1px solid var(--border); }
    :host(:last-of-type) { border-bottom: none; }
    .r { all: unset; box-sizing: border-box; width: 100%; cursor: pointer; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: var(--space-3) var(--space-4); color: var(--text); }
    .r:hover { background: var(--raised); }
    .r:focus-visible { box-shadow: inset 0 0 0 2px var(--action); }
    :host([selected]) .r { background: var(--selected); }
    .p { font: var(--type-code); }
    .meta { margin-left: auto; font: var(--type-small); color: var(--text-muted); }
    .url { flex-basis: 100%; font: 400 12px/18px var(--font-mono); color: var(--link); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `,
})
export class MkOperationRow {
  @Prop() method = 'GET';
  @Prop() path!: string;
  @Prop() protocol: Protocol = 'REST';
  /** Right-aligned metadata, e.g. "3 examples · URI_PARTS". */
  @Prop() meta?: string;
  /** Shown under the row when selected. */
  @Prop() mockUrl?: string;
  @Prop({ reflect: true }) selected = false;

  /** Emitted when the row is activated, with the operation path. */
  @Event() mkSelect!: EventEmitter<{ method: string; path: string }>;

  render() {
    return (
      <Host>
        <button class="r" aria-pressed={String(this.selected)} onClick={() => this.mkSelect.emit({ method: this.method, path: this.path })}>
          <mk-method-tag method={this.method} protocol={this.protocol} />
          <span class="p">{this.path}</span>
          {this.meta && <span class="meta">{this.meta}</span>}
          {this.selected && this.mockUrl && <span class="url">{this.mockUrl}</span>}
        </button>
      </Host>
    );
  }
}
