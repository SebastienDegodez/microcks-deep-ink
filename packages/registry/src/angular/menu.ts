import { afterNextRender, booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild, DestroyRef, inject } from '@angular/core';
import { ButtonDirective } from './button';
import type { ButtonSize, ButtonVariant } from './button';
import type { IconName } from './icon';

export interface MenuItem {
  id: string;
  label: string;
  onSelect?: () => void;
  /** Renders an `<a>` for navigation instead of a `<button>`. */
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

let nextId = 0;

/**
 * Disclosure menu on the native `popover` attribute. The trigger is a button with
 * `popovertarget` and a mirrored `aria-expanded`. Escape and click outside close it natively.
 * Up and Down move between items, Home and End jump to the ends.
 */
@Component({
  selector: 'mk-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective],
  styles: [':host { display: contents; }'],
  template: `
    <button
      #trigger
      type="button"
      mkButton
      [variant]="variant()"
      [size]="size()"
      [icon]="icon()"
      [iconOnly]="iconOnly()"
      [attr.aria-label]="iconOnly() ? label() : null"
      [attr.aria-expanded]="expanded()"
      [attr.aria-controls]="menuId"
      [attr.popovertarget]="menuId"
      (keydown)="onTriggerKeyDown($event)"
    >{{ iconOnly() ? '' : label() }}</button>
    <div #menu [id]="menuId" class="menu" popover="auto" role="group" [attr.aria-label]="label()" (toggle)="onToggle($event)">
      @for (item of items(); track item.id) {
        @if (item.href !== undefined) {
          <a class="menu-item" [attr.href]="item.href" [attr.data-tone]="item.danger ? 'danger' : null" [attr.aria-disabled]="item.disabled ? 'true' : null" (click)="choose(item)">{{ item.label }}</a>
        } @else {
          <button type="button" class="menu-item" [attr.data-tone]="item.danger ? 'danger' : null" [disabled]="!!item.disabled" (click)="choose(item)">{{ item.label }}</button>
        }
      }
      <ng-content />
    </div>
  `,
})
export class MenuComponent {
  /** Name of the trigger. With `iconOnly` it is the accessible name ("Actions"). */
  readonly label = input.required<string>();
  readonly icon = input<IconName>();
  /** Show only the icon. Requires `icon`. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly items = input.required<MenuItem[]>();
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  /** Which edge of the trigger the menu lines up with. */
  readonly align = input<'start' | 'end'>('start');
  /** Emits the id of the chosen item. */
  readonly itemSelected = output<string>();

  protected readonly menuId = `mk-menu-${++nextId}`;
  protected readonly expanded = signal(false);
  private readonly menu = viewChild.required<ElementRef<HTMLDivElement>>('menu');
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Keyboard and focus handling is attached natively: the popover container is not an interactive element.
    afterNextRender(() => {
      const m = this.menu().nativeElement;
      const onKeyDown = (e: KeyboardEvent) => {
        const els = this.itemElements();
        if (els.length === 0) return;
        const at = els.indexOf(document.activeElement as HTMLElement);
        let next: HTMLElement | undefined;
        if (e.key === 'ArrowDown') next = els[(at + 1) % els.length];
        else if (e.key === 'ArrowUp') next = els[(at - 1 + els.length) % els.length];
        else if (e.key === 'Home') next = els[0];
        else if (e.key === 'End') next = els[els.length - 1];
        else return;
        if (!next) return;
        e.preventDefault();
        next.focus();
      };
      // Tabbing out of the menu closes it, so it never stays open behind the user.
      const onFocusOut = (e: FocusEvent) => {
        const to = e.relatedTarget as Node | null;
        if (to && !m.contains(to) && !this.trigger().nativeElement.contains(to)) m.hidePopover?.();
      };
      const place = () => this.place();
      m.addEventListener('keydown', onKeyDown);
      m.addEventListener('focusout', onFocusOut);
      window.addEventListener('resize', place);
      window.addEventListener('scroll', place, true);
      this.destroyRef.onDestroy(() => {
        m.removeEventListener('keydown', onKeyDown);
        m.removeEventListener('focusout', onFocusOut);
        window.removeEventListener('resize', place);
        window.removeEventListener('scroll', place, true);
      });
    });
  }

  private itemElements(): HTMLElement[] {
    return Array.from(this.menu().nativeElement.querySelectorAll<HTMLElement>('.menu-item:not(:disabled):not([aria-disabled="true"])'));
  }

  private place(): void {
    if (!this.expanded()) return;
    const m = this.menu().nativeElement;
    const r = this.trigger().nativeElement.getBoundingClientRect();
    const mh = m.offsetHeight;
    const mw = m.offsetWidth;
    const below = r.bottom + 4;
    const top = below + mh > window.innerHeight && r.top - 4 - mh > 0 ? r.top - 4 - mh : below;
    const wanted = this.align() === 'end' ? r.right - mw : r.left;
    const left = Math.max(8, Math.min(wanted, window.innerWidth - mw - 8));
    m.style.top = `${Math.max(8, top)}px`;
    m.style.left = `${left}px`;
  }

  protected onToggle(e: Event): void {
    const open = (e as Event & { newState?: string }).newState === 'open';
    this.expanded.set(open);
    if (open) {
      this.place();
      this.itemElements()[0]?.focus();
    }
  }

  protected onTriggerKeyDown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown' && this.expanded()) {
      e.preventDefault();
      this.itemElements()[0]?.focus();
    }
  }

  protected choose(item: MenuItem): void {
    item.onSelect?.();
    this.itemSelected.emit(item.id);
    this.menu().nativeElement.hidePopover?.();
  }
}
