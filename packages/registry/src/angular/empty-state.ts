import { IconComponent, type IconName } from './icon';
import { afterEveryRender, ChangeDetectionStrategy, Component, contentChild, Directive, ElementRef, input, signal, viewChild } from '@angular/core';

let nextId = 0;

/** Buttons or links under the text: `<div mkEmptyActions>…</div>`. */
@Directive({ selector: '[mkEmptyActions]' })
export class EmptyActionsDirective {}

/** Explains why a region is empty and what to do next. */
@Component({
  selector: 'section[mkEmptyState]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    class: 'empty',
    '[attr.data-align]': 'align()',
    '[attr.aria-labelledby]': 'titleId',
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `
    @if (icon(); as i) {<span class="empty-icon"><svg mkIcon [name]="i" [size]="40"></svg></span>}
    @switch (headingLevel()) {
      @case (1) { <h1 class="empty-title" [id]="titleId">{{ title() }}</h1> }
      @case (3) { <h3 class="empty-title" [id]="titleId">{{ title() }}</h3> }
      @case (4) { <h4 class="empty-title" [id]="titleId">{{ title() }}</h4> }
      @case (5) { <h5 class="empty-title" [id]="titleId">{{ title() }}</h5> }
      @case (6) { <h6 class="empty-title" [id]="titleId">{{ title() }}</h6> }
      @default { <h2 class="empty-title" [id]="titleId">{{ title() }}</h2> }
    }
    <div #body class="empty-body" [hidden]="!hasBody()"><ng-content /></div>
    @if (actions()) {
      <div class="empty-actions"><ng-content select="[mkEmptyActions]" /></div>
    }
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  /** Heading level of the title (1-6). Keep the page heading order sequential. */
  readonly headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2);
  /** Decorative 40px icon above the title ("search-x" for no results). */
  readonly icon = input<IconName>();
  /** `center` (default) or `start`. */
  readonly align = input<'center' | 'start'>('center');

  protected readonly actions = contentChild(EmptyActionsDirective);
  protected readonly titleId = `mk-empty-title-${++nextId}`;
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  protected readonly hasBody = signal(true);

  constructor() {
    afterEveryRender(() => {
      const el = this.body().nativeElement;
      this.hasBody.set(el.childElementCount > 0 || (el.textContent ?? '').trim() !== '');
    });
  }
}
