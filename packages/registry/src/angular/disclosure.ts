import { afterNextRender, booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';

/** Native `<details>`: `<details mkDisclosure summary="More">…</details>`. Open state is exposed by the browser, so no ARIA is added. */
@Component({
  selector: 'details[mkDisclosure]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'di-disclosure' },
  template: `<summary>{{ summary() }}</summary><ng-content />`,
})
export class DisclosureComponent {
  readonly summary = input.required<string>();
  readonly defaultOpen = input(false, { transform: booleanAttribute });

  constructor() {
    const el = inject<ElementRef<HTMLDetailsElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      if (this.defaultOpen()) el.open = true;
    });
  }
}
