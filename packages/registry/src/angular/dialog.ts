import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { ButtonDirective } from './button';

let nextId = 0;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Action buttons of a dialog, aligned to the end: `<div mkDialogFooter>…</div>`. */
@Directive({ selector: '[mkDialogFooter]' })
export class DialogFooterDirective {}

/**
 * Modal dialog on the native `<dialog>` element: `<dialog mkDialog title="Delete" [(open)]="open">`.
 * `showModal()` provides the focus trap, the inert background and Escape. Focus returns to the
 * opener when the dialog closes.
 *
 * Initial focus: an element with `data-autofocus`, otherwise the first focusable control of the
 * body or footer, otherwise the close button.
 */
@Component({
  selector: 'dialog[mkDialog]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective],
  host: {
    class: 'di-dialog',
    '[attr.data-size]': 'size()',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.aria-describedby]': 'description() ? descId : null',
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
    '(close)': 'onNativeClose()',
    '(click)': 'onClick($event)',
  },
  template: `
    @if (open()) {
      <div class="di-dialog-header">
        <h2 class="di-dialog-title" [id]="titleId">{{ title() }}</h2>
        <button type="button" mkButton variant="ghost" size="sm" iconOnly icon="close" aria-label="Close" (click)="requestClose()"></button>
      </div>
      <div class="di-dialog-body">
        @if (description()) {
          <p class="di-dialog-description" [id]="descId">{{ description() }}</p>
        }
        <ng-content />
      </div>
      @if (footer()) {
        <div class="di-dialog-footer"><ng-content select="[mkDialogFooter]" /></div>
      }
    }
  `,
})
export class DialogComponent {
  /** Two-way: set to false to close. Also set to false when Escape or the close button closes it. */
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Close on a click on the backdrop. Off by default so a stray click never loses typed data. */
  readonly closeOnBackdrop = input(false, { transform: booleanAttribute });
  /** Emits when the dialog asks to close: Escape, the close button or a backdrop click. */
  readonly closed = output<void>();

  protected readonly footer = contentChild(DialogFooterDirective);
  private readonly uid = `mk-dialog-${++nextId}`;
  protected readonly titleId = `${this.uid}-title`;
  protected readonly descId = `${this.uid}-desc`;

  private readonly el = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => (open ? this.show() : this.hide()));
    });
  }

  private show(): void {
    if (this.el.open) return;
    // Wait for the content to render, then open and move focus.
    afterNextRender(
      () => {
        if (!this.open() || this.el.open) return;
        this.opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        this.el.showModal();
        const el = this.el;
        const preferred =
          el.querySelector<HTMLElement>('[data-autofocus]') ??
          el.querySelector<HTMLElement>(FOCUSABLE.split(', ').map((s) => `.di-dialog-body ${s}`).join(', ')) ??
          el.querySelector<HTMLElement>(FOCUSABLE.split(', ').map((s) => `.di-dialog-footer ${s}`).join(', '));
        preferred?.focus();
      },
      { injector: this.injector },
    );
  }

  private hide(): void {
    if (this.el.open) this.el.close();
  }

  protected requestClose(): void {
    this.open.set(false);
    this.closed.emit();
  }

  protected onClick(e: MouseEvent): void {
    // A click that lands on the dialog element itself is a click on the backdrop.
    if (this.closeOnBackdrop() && e.target === this.el) this.requestClose();
  }

  /** Runs whatever closed the dialog (Escape, button, `open`): restore focus, tell the owner. */
  protected onNativeClose(): void {
    const target = this.opener;
    this.opener = null;
    target?.focus();
    if (this.open()) {
      this.open.set(false);
      this.closed.emit();
    }
  }
}
