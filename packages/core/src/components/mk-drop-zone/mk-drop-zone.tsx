import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { icon } from '../../utils/icons';

/**
 * Drop a contract here. Direct-manipulation target: radius-node, space-12 padding.
 * @slot - Extra content under the prompt (e.g. accepted formats).
 */
@Component({
  tag: 'mk-drop-zone',
  shadow: true,
  styles: `
    :host { display: block; }
    label { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-12); border: 1.5px dashed var(--border-strong); border-radius: var(--radius-node); background: var(--surface); color: var(--text-secondary); text-align: center; cursor: pointer; }
    label.over { border-color: var(--action); background: var(--selected); color: var(--text); }
    label:focus-within { box-shadow: var(--shadow-focus); border-color: var(--action); }
    strong { font: var(--type-heading); color: var(--text); }
    .hint { font: var(--type-small); color: var(--text-muted); }
    input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  `,
})
export class MkDropZone {
  @Prop() heading = 'Drop a contract anywhere';
  @Prop() hint = 'OpenAPI, AsyncAPI, gRPC, GraphQL, Postman, SoapUI, HAR, Arazzo';
  /** Value of the native input accept attribute. */
  @Prop() accept?: string;
  @Prop() multiple = true;

  @State() over = false;

  /** Emitted with the dropped or picked files. */
  @Event() mkFiles!: EventEmitter<File[]>;

  private emit(list: FileList | null) {
    if (list && list.length) this.mkFiles.emit(Array.from(list));
  }

  render() {
    return (
      <Host>
        <label
          class={{ over: this.over }}
          onDragOver={(e) => {
            e.preventDefault();
            this.over = true;
          }}
          onDragLeave={() => (this.over = false)}
          onDrop={(e) => {
            e.preventDefault();
            this.over = false;
            this.emit(e.dataTransfer?.files ?? null);
          }}
        >
          {icon('upload', 28)}
          <strong>{this.heading}</strong>
          <span class="hint">{this.hint}</span>
          <slot />
          <input type="file" accept={this.accept} multiple={this.multiple} onChange={(e) => this.emit((e.target as HTMLInputElement).files)} />
        </label>
      </Host>
    );
  }
}
