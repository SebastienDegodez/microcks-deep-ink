import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Marks a real-time stream. Not a status and not a live region: announce stream changes elsewhere,
 * and pair it with a Pause control.
 */
@Component({
  selector: 'span[mkLiveIndicator]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'di-live', '[attr.data-paused]': "paused() ? '' : null" },
  template: `<span class="di-live-dot" aria-hidden="true"></span>{{ label() }}@if (paused()) {<span class="di-live-paused"> · paused</span>}`,
})
export class LiveIndicatorComponent {
  readonly label = input('live');
  /** The stream is paused: the dot stops and "paused" is written next to the label. */
  readonly paused = input(false, { transform: booleanAttribute });
}
