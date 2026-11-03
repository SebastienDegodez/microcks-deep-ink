import { afterNextRender, booleanAttribute, Directive, effect, ElementRef, inject, input, isDevMode } from '@angular/core';
import { createIconElement } from './icon';
import type { IconName } from './icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

/**
 * Native `<button>` or `<a>` with the `di-button` styling: `<button mkButton variant="primary">Save</button>`.
 * Defaults to `type="button"`. Use `<a mkButton href="...">` for navigation, a button for actions.
 * `md` is 44px high; `sm` is 32px and is never used for the primary action of a page.
 */
@Directive({
  selector: 'button[mkButton], a[mkButton]',
  exportAs: 'mkButton',
  host: {
    class: 'di-button',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-confirm]': "confirm() ? '' : null",
    '[attr.data-icon-only]': "iconOnly() ? '' : null",
    '[attr.aria-busy]': "loading() ? 'true' : null",
  },
})
export class ButtonDirective {
  /** One primary per task region. */
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  /** Filled danger, only inside a confirmation dialog. Use with `variant="danger"`. */
  readonly confirm = input(false, { transform: booleanAttribute });
  /** Leading icon name. */
  readonly icon = input<IconName>();
  /** Icon-only button. Requires an accessible name (`aria-label`). */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /** Sets `aria-busy` and disables the button. */
  readonly loading = input(false, { transform: booleanAttribute });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const el = this.el;
    if (el instanceof HTMLButtonElement && !el.hasAttribute('type')) el.type = 'button';

    // Leading icon, inserted as the first child of the host.
    let iconEl: SVGSVGElement | null = null;
    effect(() => {
      const name = this.icon();
      const size = this.size() === 'sm' ? 14 : 16;
      iconEl?.remove();
      iconEl = null;
      if (name) {
        iconEl = createIconElement(name, size);
        el.prepend(iconEl);
      }
    });

    // Loading disables a native button and restores its previous state afterwards.
    let saved: boolean | null = null;
    effect(() => {
      if (!(el instanceof HTMLButtonElement)) return;
      if (this.loading()) {
        saved = el.disabled;
        el.disabled = true;
      } else if (saved !== null) {
        el.disabled = saved;
        saved = null;
      }
    });

    afterNextRender(() => {
      if (!isDevMode() || !this.iconOnly()) return;
      if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') || el.hasAttribute('title')) return;
      console.error('Deep Ink Button: an icon-only button needs an accessible name. Add aria-label.');
    });
  }
}
