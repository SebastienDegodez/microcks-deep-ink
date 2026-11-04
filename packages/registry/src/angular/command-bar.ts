import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from './icon';

/* Types are identical to the React component's (keep them in step). */
export type CommandProtocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';

export interface CommandItem {
  id: string;
  label: string;
  /** 'action' items are commands (run a test…); others are navigation targets. */
  kind: 'action' | 'service' | 'operation' | 'test';
  protocol?: CommandProtocol;
  hint?: string;
  keywords?: string[];
}

const KINDS: CommandItem['kind'][] = ['action', 'service', 'operation', 'test'];
const KIND_LABEL: Record<CommandItem['kind'], string> = {
  action: 'Actions',
  service: 'Services',
  operation: 'Operations',
  test: 'Tests',
};
const PROTOCOL_TOKEN: Record<CommandProtocol, string> = {
  REST: 'proto-rest',
  SOAP: 'proto-soap',
  EVENT: 'proto-event',
  gRPC: 'proto-grpc',
  GRAPHQL: 'proto-graphql',
  DIRECT: 'proto-direct',
  A2A: 'proto-a2a',
};

let nextId = 0;

interface Row {
  item: CommandItem;
  idx: number;
}

/** Active element, looking through shadow roots, so focus can return to the real opener. */
function deepActiveElement(): HTMLElement | null {
  let el = document.activeElement as HTMLElement | null;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement as HTMLElement;
  return el;
}

/**
 * Command bar (Ctrl/⌘K): `<mk-command-bar [items]="…" [(open)]="open" (command)="run($event)" />`.
 * WAI-ARIA 1.2 combobox with a listbox popup (aria-activedescendant keeps DOM focus in the input).
 * Modal mode is a native `<dialog>` opened with `showModal()`: focus is trapped, Escape closes,
 * and focus returns to the opener. `inline` renders the same widget in place, for docs and embedding.
 */
@Component({
  selector: 'mk-command-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  host: { style: 'display: contents', '(document:keydown)': 'onGlobalKey($event)' },
  template: `
    <ng-template #panel>
      <div class="command-bar-panel">
        <div class="command-bar-search">
          <svg mkIcon name="search" [size]="18"></svg>
          <label class="sr-only" [for]="uid + '-input'">{{ label() }}</label>
          <input
            #search
            [id]="uid + '-input'"
            class="command-bar-input"
            type="text"
            role="combobox"
            autocomplete="off"
            aria-autocomplete="list"
            [attr.aria-expanded]="rows().length > 0"
            [attr.aria-controls]="rows().length > 0 ? uid + '-list' : null"
            [attr.aria-activedescendant]="rows().length > 0 ? uid + '-o' + cur() : null"
            [attr.aria-keyshortcuts]="globalShortcut() ? 'Control+K Meta+K' : null"
            [placeholder]="placeholder()"
            [value]="query()"
            (input)="onInput($event)"
            (keydown)="onKey($event)"
          />
          @if (globalShortcut()) {
            <kbd class="command-bar-kbd" aria-hidden="true">Ctrl K</kbd>
          }
          @if (!inline()) {
            <button type="button" class="command-bar-close" aria-label="Close" (click)="close()">
              <svg mkIcon name="close" [size]="18"></svg>
            </button>
          }
        </div>
        @if (rows().length > 0) {
          <div #list class="command-bar-list" [id]="uid + '-list'" role="listbox" [attr.aria-label]="label() + ' results'">
            @for (g of groups(); track g.kind) {
              <div class="command-bar-group" role="group" [attr.aria-label]="g.title">
                <div class="command-bar-group-title" aria-hidden="true">{{ g.title }}</div>
                @for (r of g.rows; track r.item.id) {
                  <!-- Keyboard: the combobox owns it (aria-activedescendant); the pointer can pick an option too. -->
                  <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events -->
                  <div
                    [id]="uid + '-o' + r.idx"
                    class="command-bar-option"
                    role="option"
                    tabindex="-1"
                    [attr.aria-selected]="r.idx === cur()"
                    (mousemove)="active.set(r.idx)"
                    (mousedown)="$event.preventDefault()"
                    (click)="choose(r.item)"
                  >
                    @if (r.item.kind === 'action') {
                      <span class="command-bar-tag" data-kind="action">RUN</span>
                    } @else if (r.item.protocol) {
                      <span class="command-bar-tag" [style.background]="protoVar(r.item)">{{ r.item.protocol }}</span>
                    } @else {
                      <span class="command-bar-tag" data-kind="nav">{{ r.item.kind.toUpperCase() }}</span>
                    }
                    <span>{{ r.item.label }}</span>
                    <span class="command-bar-hint" aria-hidden="true">{{ r.idx === cur() ? 'Enter' : (r.item.hint ?? r.item.kind) }}</span>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="command-bar-empty">No match. Try a service name or "test".</div>
        }
        <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ open() || inline() ? announce() : '' }}</div>
      </div>
    </ng-template>

    @if (inline()) {
      <div class="command-bar" data-inline="" role="group" [attr.aria-label]="label()">
        <ng-container [ngTemplateOutlet]="panel" />
      </div>
    } @else {
      <!-- A click on the dialog element itself is a click on the backdrop; Escape is the keyboard path. -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
      <dialog #dialog class="command-bar" [attr.aria-label]="label()" (cancel)="onCancel($event)" (close)="onNativeClose()" (click)="onDialogClick($event)">
        @if (open()) {
          <ng-container [ngTemplateOutlet]="panel" />
        }
      </dialog>
    }
  `,
})
export class CommandBarComponent {
  readonly items = input.required<CommandItem[]>();
  /** Modal mode, two-way: set to true to open. Ctrl/⌘K, Escape, the close button and a command change it too. */
  readonly open = model(false);
  /** Render in place instead of in a dialog (docs, embedding). */
  readonly inline = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Jump to a service, or type an action…');
  /** Ctrl/⌘K opens the bar from anywhere. Default true. */
  readonly globalShortcut = input(true, { transform: booleanAttribute });
  /** Accessible name of the dialog and the search field. Default "Command bar". */
  readonly label = input('Command bar');

  /** Emits the chosen item. */
  readonly command = output<CommandItem>();
  /** Emits when the modal closes: Escape, backdrop, close button, or after a command ran. */
  readonly closed = output<void>();

  protected readonly uid = `mk-command-bar-${++nextId}`;
  protected readonly query = signal('');
  protected readonly active = signal(0);

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private opener: HTMLElement | null = null;

  /** Results grouped by kind, in display order. Flat index = position in this array. */
  protected readonly results = computed(() => {
    const words = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = this.items().filter((i) => {
      const hay = [i.label, ...(i.keywords ?? [])].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    return KINDS.flatMap((k) => filtered.filter((i) => i.kind === k));
  });
  protected readonly rows = computed<Row[]>(() => this.results().map((item, idx) => ({ item, idx })));
  protected readonly groups = computed(() =>
    KINDS.map((kind) => ({ kind, title: KIND_LABEL[kind], rows: this.rows().filter((r) => r.item.kind === kind) })).filter(
      (g) => g.rows.length > 0,
    ),
  );
  protected readonly cur = computed(() => Math.max(0, Math.min(this.active(), this.rows().length - 1)));
  protected readonly announce = computed(() => {
    const n = this.rows().length;
    return n === 0 ? 'No results' : `${n} ${n === 1 ? 'result' : 'results'}`;
  });

  constructor() {
    // Reset the active option when the items change.
    let prev: CommandItem[] | undefined;
    effect(() => {
      const items = this.items();
      if (prev !== undefined && prev !== items) untracked(() => this.active.set(0));
      prev = items;
    });
    // Open and close the native dialog; focus goes to the search field, then back to the opener.
    afterRenderEffect(() => {
      const open = this.open();
      const dialog = this.dialog()?.nativeElement;
      if (this.inline() || !dialog) return;
      untracked(() => {
        if (open && !dialog.open) {
          this.opener = deepActiveElement();
          dialog.showModal();
          this.search()?.nativeElement.focus();
        } else if (!open && dialog.open) {
          dialog.close();
          const o = this.opener;
          this.opener = null;
          if (o?.isConnected) o.focus();
        }
      });
    });
    // Keep the active option visible while moving with the arrow keys.
    afterRenderEffect(() => {
      const i = this.cur();
      this.list()
        ?.nativeElement.querySelector(`[id="${this.uid}-o${i}"]`)
        ?.scrollIntoView?.({ block: 'nearest' });
    });
    inject(DestroyRef).onDestroy(() => {
      const d = this.dialog()?.nativeElement;
      if (d?.open) d.close();
    });
  }

  protected protoVar(i: CommandItem): string {
    return i.protocol ? `var(--${PROTOCOL_TOKEN[i.protocol]})` : '';
  }

  protected onGlobalKey(e: KeyboardEvent): void {
    if (!this.globalShortcut() || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
    e.preventDefault();
    if (this.inline()) this.search()?.nativeElement.focus();
    else if (this.open()) this.close();
    else this.open.set(true);
  }

  protected onInput(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
    this.active.set(0);
  }

  protected onCancel(e: Event): void {
    e.preventDefault();
    this.close();
  }

  protected onNativeClose(): void {
    if (this.open()) this.close();
  }

  protected onDialogClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close();
  }

  /** Closes the modal (or clears the inline field). */
  close(): void {
    this.query.set('');
    this.active.set(0);
    if (this.inline()) return;
    const wasOpen = this.open();
    this.open.set(false);
    if (wasOpen) this.closed.emit();
  }

  protected choose(item?: CommandItem): void {
    if (!item) return;
    this.command.emit(item);
    if (!this.inline()) this.close();
  }

  protected onKey(e: KeyboardEvent): void {
    const list = this.results();
    const last = list.length - 1;
    const cur = this.cur();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (last >= 0) this.active.set(cur >= last ? 0 : cur + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (last >= 0) this.active.set(cur <= 0 ? last : cur - 1);
        break;
      case 'Home':
        if (last >= 0) {
          e.preventDefault();
          this.active.set(0);
        }
        break;
      case 'End':
        if (last >= 0) {
          e.preventDefault();
          this.active.set(last);
        }
        break;
      case 'Enter':
        if (list[cur]) {
          e.preventDefault();
          this.choose(list[cur]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        this.close();
        break;
    }
  }
}
