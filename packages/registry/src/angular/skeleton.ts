import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Decorative placeholder, hidden from assistive technology: set `aria-busy="true"` on the
 * container that is loading and announce completion with a live region.
 */
@Component({
  selector: 'span[mkSkeleton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.skeleton]': 'lines() <= 1',
    '[class.skeleton-group]': 'lines() > 1',
    '[style.--skeleton-width]': 'cssWidth()',
  },
  template: `@if (lines() > 1) { @for (n of range(); track n) {<span class="skeleton"></span>} }`,
})
export class SkeletonComponent {
  /** Number of text-like lines. */
  readonly lines = input(1);
  readonly width = input<string | number>();

  protected readonly range = computed(() => Array.from({ length: this.lines() }, (_, i) => i));
  protected readonly cssWidth = computed(() => {
    const w = this.width();
    return w === undefined ? null : typeof w === 'number' ? `${w}px` : w;
  });
}
