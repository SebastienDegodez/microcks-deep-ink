import { afterEveryRender, booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { IconComponent } from './icon';

export type ChipTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ChipVariant = 'solid' | 'outline' | 'dashed';

/**
 * Small label. `<span mkChip>` is static; `<button mkChip [pressed]="on">` is a toggle (filters);
 * `removable` adds a remove button named "Remove <text>".
 */
@Component({
  selector: 'span[mkChip], button[mkChip]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    class: 'chip',
    '[attr.data-tone]': 'tone()',
    '[attr.data-variant]': 'variant()',
    '[attr.aria-pressed]': 'ariaPressed()',
  },
  template: `@if (labelKey()) {<span class="chip-key">{{ labelKey() }}=</span>}<ng-content />@if (removable() && !isButton) {<button type="button" class="chip-remove" [attr.aria-label]="removeName()" (click)="removed.emit()"><svg mkIcon name="close" [size]="12"></svg></button>}`,
})
export class ChipComponent {
  /** Key rendered before the text for `key=value` labels. */
  readonly labelKey = input<string>();
  readonly tone = input<ChipTone>('neutral');
  readonly variant = input<ChipVariant>('solid');
  /** On a `<button mkChip>`: the toggle state, exposed as `aria-pressed`. */
  readonly pressed = input<boolean | undefined>(undefined);
  /** Adds a remove button. Ignored on toggle chips. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Accessible name of the remove button. Defaults to "Remove <chip text>". */
  readonly removeLabel = input<string>();
  readonly removed = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly isButton = this.host instanceof HTMLButtonElement;
  private readonly text = signal('');

  constructor() {
    if (this.host instanceof HTMLButtonElement && !this.host.hasAttribute('type')) this.host.type = 'button';
    afterEveryRender(() => {
      let t = '';
      this.host.childNodes.forEach((n) => {
        const el = n as HTMLElement;
        if (n.nodeType === Node.TEXT_NODE) t += n.textContent ?? '';
        else if (el.classList && !el.classList.contains('chip-key') && !el.classList.contains('chip-remove')) t += el.textContent ?? '';
      });
      this.text.set(t.trim());
    });
  }

  protected ariaPressed(): string | null {
    const p = this.pressed();
    return this.isButton && p !== undefined ? String(p) : null;
  }

  protected removeName(): string {
    return this.removeLabel() ?? `Remove ${[this.labelKey(), this.text()].filter(Boolean).join(' ')}`.trim();
  }
}
