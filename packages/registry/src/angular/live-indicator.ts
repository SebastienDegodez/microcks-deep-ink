import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon';

/**
 * Marks a real-time stream. Not a status and not a live region: announce stream changes elsewhere,
 * and pair it with a Pause control.
 */
@Component({
  selector: 'span[mkLiveIndicator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  host: {
    class: 'live',
    '[attr.data-paused]': "paused() ? '' : null",
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
  },
  template: `@if (paused()) {<svg mkIcon name="pause" [size]="10"></svg>} @else {<span class="live-dot" aria-hidden="true"></span>}@if (variant() === 'dot') {<span class="sr-only"><ng-container [ngTemplateOutlet]="text"></ng-container></span>} @else {<ng-container [ngTemplateOutlet]="text"></ng-container>}<ng-template #text>@if (paused() && pausedLabel()) {{{ pausedLabel() }}} @else {{{ label() }}@if (paused()) {<span class="live-paused"> · paused</span>}}</ng-template>`,
})
export class LiveIndicatorComponent {
  readonly label = input('live');
  /** The stream is paused: a pause glyph replaces the dot and "paused" is written. */
  readonly paused = input(false, { transform: booleanAttribute });
  /** Text shown while paused, instead of "<label> · paused": "paused · 2 new calls". Write the word "paused". */
  readonly pausedLabel = input<string>();
  /** `sm`: 11px, padding 2px 8px. `lg` (box only): 44px, 13px. */
  readonly size = input<'md' | 'sm' | 'lg'>('md');
  /**
   * `inline`: no pill border, for KPI cards. `box`: a dashed 36px (lg 44px) frame in place of a busy button.
   * `dot`: the 7px dot only, the label is visually hidden but still read (Agent tasks table, live task row).
   */
  readonly variant = input<'pill' | 'inline' | 'box' | 'dot'>('pill');
}
