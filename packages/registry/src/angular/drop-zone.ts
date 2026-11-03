import { booleanAttribute, ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IconComponent } from './icon';

let nextId = 0;

export function filesReadyMessage(count: number): string {
  return `${count} ${count === 1 ? 'file' : 'files'} ready`;
}

/**
 * A real file input (visually hidden, still focusable) named by a visible "Choose files" label.
 * Drag and drop is an enhancement: every function works with the keyboard.
 */
@Component({
  selector: 'mk-drop-zone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    class: 'drop-zone',
    role: 'group',
    '[attr.aria-labelledby]': 'id + "-heading"',
    '[attr.data-dragging]': "dragging() ? '' : null",
    '(dragover)': 'onOver($event)',
    '(dragleave)': 'onLeave($event)',
    '(drop)': 'onDrop($event)',
  },
  template: `
    <svg mkIcon name="upload" [size]="28"></svg>
    <p class="drop-zone-heading" [id]="id + '-heading'">{{ heading() }}</p>
    <p class="drop-zone-hint" [id]="id + '-hint'">{{ hint() }}</p>
    <input
      type="file"
      class="drop-zone-input sr-only"
      [id]="id"
      [attr.accept]="accept() ?? null"
      [multiple]="multiple()"
      [attr.aria-describedby]="id + '-heading ' + id + '-hint'"
      (change)="onChange($event)"
    />
    <label [attr.for]="id" class="button drop-zone-choose" data-variant="primary">Choose files</label>
    <p class="drop-zone-status" role="status">{{ message() }}</p>
  `,
})
export class DropZoneComponent {
  readonly heading = input.required<string>();
  readonly hint = input.required<string>();
  /** Passed to the native input as a picker hint. Validate files in your application. */
  readonly accept = input<string>();
  readonly multiple = input(true, { transform: booleanAttribute });
  /** Emits the chosen or dropped files. */
  readonly files = output<File[]>();

  protected readonly id = `mk-drop-zone-${++nextId}`;
  protected readonly dragging = signal(false);
  protected readonly message = signal('');

  private take(list: FileList | null | undefined): void {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    this.message.set(filesReadyMessage(files.length));
    this.files.emit(files);
  }

  protected onOver(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(true);
  }
  protected onLeave(e: DragEvent): void {
    const zone = e.currentTarget as HTMLElement;
    if (!zone.contains(e.relatedTarget as Node | null)) this.dragging.set(false);
  }
  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    this.take(e.dataTransfer?.files);
  }
  protected onChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.take(input.files);
    input.value = '';
  }
}
