import { DestroyRef, Directive, ElementRef, booleanAttribute, effect, inject, input, output } from '@angular/core';
import './elements/command-bar.js';

/* Types mirror packages/core/src/utils/types.ts and the React wrapper (keep them identical). */
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

/** The `<command-bar>` element and its properties. */
export interface CommandBarElement extends HTMLElement {
  items: CommandItem[];
  open: boolean;
  inline: boolean;
  placeholder: string;
  globalShortcut: boolean;
  label: string;
  show(): Promise<void>;
  hide(): Promise<void>;
}

/**
 * Command bar (Ctrl/⌘K). Add it as `<command-bar [items]="…" [open]="open()" (command)="run($event)"
 * (closed)="open.set(false)" />`. The host component needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`.
 */
@Directive({ selector: 'command-bar' })
export class CommandBarDirective {
  private readonly host = inject<ElementRef<CommandBarElement>>(ElementRef);

  readonly items = input.required<CommandItem[]>();
  /** Modal mode: controls the dialog. Update your state from `closed`. */
  readonly open = input<boolean | undefined>(undefined);
  /** Render in place instead of in a dialog (docs, embedding). */
  readonly inline = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string | undefined>(undefined);
  /** Ctrl/⌘K opens the bar from anywhere. Default true. */
  readonly globalShortcut = input<boolean | undefined>(undefined);
  /** Accessible name of the dialog and the search field. Default "Command bar". */
  readonly label = input<string | undefined>(undefined);

  /** Emits the chosen item (`mkCommand`). */
  readonly command = output<CommandItem>();
  /** Emits when the modal closes (`mkClose`): Escape, backdrop, close button, or after a command ran. */
  readonly closed = output<void>();

  constructor() {
    const el = this.host.nativeElement;
    effect(() => {
      el.items = this.items();
    });
    effect(() => {
      const open = this.open();
      if (open !== undefined) el.open = open;
    });
    effect(() => {
      el.inline = this.inline();
    });
    effect(() => {
      const placeholder = this.placeholder();
      if (placeholder !== undefined) el.placeholder = placeholder;
    });
    effect(() => {
      const globalShortcut = this.globalShortcut();
      if (globalShortcut !== undefined) el.globalShortcut = globalShortcut;
    });
    effect(() => {
      const label = this.label();
      if (label !== undefined) el.label = label;
    });

    const onCommand = (e: Event) => this.command.emit((e as CustomEvent<CommandItem>).detail);
    const onClose = () => this.closed.emit();
    el.addEventListener('mkCommand', onCommand);
    el.addEventListener('mkClose', onClose);
    inject(DestroyRef).onDestroy(() => {
      el.removeEventListener('mkCommand', onCommand);
      el.removeEventListener('mkClose', onClose);
    });
  }
}
