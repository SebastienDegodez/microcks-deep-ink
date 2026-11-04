import { booleanAttribute, ChangeDetectionStrategy, Component, contentChild, Directive, ElementRef, inject, input } from '@angular/core';

let nextId = 0;

/** Marks the controls aligned to the end of a panel header: `<div mkPanelActions>…</div>`. */
@Directive({ selector: '[mkPanelActions]' })
export class PanelActionsDirective {}

/**
 * Panel on `canvas` with a hairline border. Elevation is a lighter ink, never a shadow.
 * Put it on the native element you want: `<section mkPanel title="Operations">`.
 */
@Component({
  selector: 'section[mkPanel], div[mkPanel], article[mkPanel], aside[mkPanel]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'panel',
    '[attr.data-flush]': "flush() ? '' : null",
    '[attr.data-title]': "titleStyle() === 'label' ? 'label' : null",
    '[attr.data-pad]': "padding() === 'lg' ? 'lg' : null",
    '[attr.aria-labelledby]': 'title() ? titleId : null',
    '[attr.role]': "title() && isDiv ? 'region' : null",
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `
    @if (title() || actions()) {
      <div class="panel-header">
        @if (title()) {
          @switch (headingLevel()) {
            @case (1) { <h1 class="panel-title" [id]="titleId">{{ title() }}</h1> }
            @case (3) { <h3 class="panel-title" [id]="titleId">{{ title() }}</h3> }
            @case (4) { <h4 class="panel-title" [id]="titleId">{{ title() }}</h4> }
            @case (5) { <h5 class="panel-title" [id]="titleId">{{ title() }}</h5> }
            @case (6) { <h6 class="panel-title" [id]="titleId">{{ title() }}</h6> }
            @default { <h2 class="panel-title" [id]="titleId">{{ title() }}</h2> }
          }
        }
        @if (actions()) {
          <div class="panel-actions"><ng-content select="[mkPanelActions]" /></div>
        }
      </div>
    }
    <div class="panel-body"><ng-content /></div>
  `,
})
export class PanelComponent {
  /** Visible heading. When set, the panel is labelled by it. */
  readonly title = input<string>();
  /** Level of the title heading. Keep the page outline ordered. */
  readonly headingLevel = input<1 | 2 | 3 | 4 | 5 | 6>(2);
  /** Removes the body padding, for tables and lists. */
  readonly flush = input(false, { transform: booleanAttribute });
  /** `heading` (16px, default) or `label` (12px uppercase, muted). */
  readonly titleStyle = input<'heading' | 'label'>('heading');
  /** `md` = 16px padding (default), `lg` = 20px. */
  readonly padding = input<'md' | 'lg'>('md');

  protected readonly actions = contentChild(PanelActionsDirective);
  protected readonly titleId = `mk-panel-title-${++nextId}`;
  protected readonly isDiv = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === 'DIV';
}
