import { afterEveryRender, booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { IconComponent } from './icon';
import { PROTOCOL_ATTR, type Protocol } from './method-tag';

export type { Protocol } from './method-tag';

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
    '[attr.data-size]': 'size()',
    '[attr.data-protocol]': 'protocolAttr()',
    "[attr.data-empty]": "count() === 0 ? '' : null",
    '[attr.aria-pressed]': 'ariaPressed()',
  },
  template: `<span class="chip-label">@if (labelKey()) {<span class="chip-key">{{ labelKey() }}</span><span class="chip-eq">=</span>}<span class="chip-value"><ng-content /></span></span>@if (count() !== undefined) {&ngsp;<span class="chip-count">{{ count() }}</span>}@if (removable() && !isButton) {<button type="button" class="chip-remove" [attr.aria-label]="removeName()" (click)="removed.emit()"><svg mkIcon name="close" [size]="12"></svg></button>}`,
})
export class ChipComponent {
  /** Key rendered before the text for `key=value` labels. */
  readonly labelKey = input<string>();
  readonly tone = input<ChipTone>('neutral');
  readonly variant = input<ChipVariant>('solid');
  /** `sm`: 11px, padding 1px 8px (row labels). `lg`: a 30px category pill in the UI font, 600 when pressed. */
  readonly size = input<'md' | 'sm' | 'lg'>('md');
  /** Protocol filter: square corners and a colour swatch; pressed fills with the protocol colour. */
  readonly protocol = input<Protocol>();
  /** Count after the text, read as "REST 4". A zero count dims the chip. */
  readonly count = input<number>();
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
      this.text.set((this.host.querySelector('.chip-value')?.textContent ?? '').trim());
    });
  }

  protected protocolAttr(): string | null {
    const p = this.protocol();
    return p ? PROTOCOL_ATTR[p] : null;
  }

  protected ariaPressed(): string | null {
    const p = this.pressed();
    return this.isButton && p !== undefined ? String(p) : null;
  }

  protected removeName(): string {
    return this.removeLabel() ?? `Remove ${[this.labelKey(), this.text()].filter(Boolean).join(' ')}`.trim();
  }
}
