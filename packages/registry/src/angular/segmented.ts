import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent, type IconName } from './icon';

export type SegmentedDot = 'neutral' | 'success' | 'danger' | 'warning' | 'muted' | 'ring';

export interface SegmentedOption {
  id: string;
  label: string;
  /** Result count, read as "Failed, 2". */
  count?: number;
  /** Leading 8px dot (decorative: the label carries the meaning). `ring` is an empty muted ring. */
  dot?: SegmentedDot;
  /** Leading icon (decorative). */
  icon?: IconName;
}

/**
 * Filter buttons that behave like one choice (All / Passed / Failed). A `role="group"` of
 * buttons with `aria-pressed`. Announce the result count of the filtered list in a live region.
 */
@Component({
  selector: 'mk-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'segmented', role: 'group', '[attr.aria-label]': 'label()', '[attr.data-variant]': 'variant()' },
  template: `@for (o of options(); track o.id) {<button type="button" [attr.aria-pressed]="o.id === value()" (click)="value.set(o.id)">@if (o.dot) {<span class="segmented-dot" [attr.data-dot]="o.dot" aria-hidden="true"></span>}@if (o.icon) {<svg mkIcon [name]="o.icon" [size]="15"></svg>}{{ o.label }}@if (o.count !== undefined) {<span class="segmented-count"><span class="sr-only">, </span>{{ o.count }}</span>}</button>}`,
})
export class SegmentedComponent {
  /** Accessible name of the group ("Result"). */
  readonly label = input.required<string>();
  readonly options = input.required<SegmentedOption[]>();
  /** Id of the pressed option. */
  readonly value = model.required<string>();
  /** `track` (default): padded track, the pressed option raised. `joined`: bordered cells side by side. */
  readonly variant = input<'track' | 'joined'>('track');
}
