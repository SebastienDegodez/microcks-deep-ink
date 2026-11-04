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
  /** Colour of the icon (Sources status filter). The label still carries the meaning. */
  iconTone?: 'success' | 'warning' | 'danger' | 'muted';
}

/**
 * Filter buttons that behave like one choice (All / Passed / Failed). A `role="group"` of
 * buttons with `aria-pressed`. Announce the result count of the filtered list in a live region.
 */
@Component({
  selector: 'mk-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: {
    class: 'segmented', role: 'group', '[attr.aria-label]': 'label()', '[attr.data-variant]': 'variant()', '[attr.data-tone]': 'tone()',
    '[attr.data-pressed-fill]': "pressedFill() === 'selected' ? 'selected' : null",
    '[attr.data-size]': "size() === 'sm' ? 'sm' : null",
    '[attr.data-spacing]': "spacing() === 'wide' ? 'wide' : null",
  },
  template: `@for (o of options(); track o.id) {<button type="button" [attr.aria-pressed]="o.id === value()" (click)="value.set(o.id)">@if (o.dot) {<span class="segmented-dot" [attr.data-dot]="o.dot" aria-hidden="true"></span>}@if (o.icon) {<svg mkIcon [name]="o.icon" [size]="iconSize()" [attr.data-tone]="o.iconTone ?? null"></svg>}{{ o.label }}@if (o.count !== undefined) {<span class="segmented-count"><span class="sr-only">, </span>{{ o.count }}</span>}</button>}`,
})
export class SegmentedComponent {
  /** Accessible name of the group ("Result"). */
  readonly label = input.required<string>();
  readonly options = input.required<SegmentedOption[]>();
  /** Id of the pressed option. */
  readonly value = model.required<string>();
  /** `track` (default): padded track, the pressed option raised. `joined`: bordered cells side by side. */
  readonly variant = input<'track' | 'joined'>('track');
  /** `primary` (joined only): the pressed option is filled with the action colour. */
  readonly tone = input<'neutral' | 'primary'>('neutral');
  /** Track only. Fill of the pressed option: `raised` (default) or `selected` (Sources). */
  readonly pressedFill = input<'raised' | 'selected'>('raised');
  /** Icon size in px: 15 (default) or 13 (Sources status icons). */
  readonly iconSize = input<13 | 15>(15);
  /** `sm` (joined): 28px, mono 12px 600, no separators (Behavior, Admin, Copilot). */
  readonly size = input<'md' | 'sm'>('md');
  /** `wide`: 0 12px button padding instead of 0 10px (Usage period). */
  readonly spacing = input<'normal' | 'wide'>('normal');
}
