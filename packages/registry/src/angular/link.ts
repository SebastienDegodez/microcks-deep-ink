import { booleanAttribute, ChangeDetectionStrategy, Component, effect, ElementRef, inject, input } from '@angular/core';
import { IconComponent } from './icon';

/**
 * Link, always underlined in body text: `<a mkLink href="…">`. `external` opens in a new tab and
 * adds an icon, a hidden notice and `rel="noopener noreferrer"`.
 */
@Component({
  selector: 'a[mkLink]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'link', '[attr.data-external]': "external() ? '' : null" },
  template: `<ng-content />@if (external()) {<svg mkIcon name="external" [size]="14"></svg>&ngsp;<span class="sr-only">(opens in a new tab)</span>}`,
})
export class LinkComponent {
  readonly external = input(false, { transform: booleanAttribute });

  constructor() {
    const el = inject<ElementRef<HTMLAnchorElement>>(ElementRef).nativeElement;
    effect(() => {
      if (this.external()) {
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
    });
  }
}
