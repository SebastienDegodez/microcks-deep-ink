import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon';
import type { IconName } from './icon';

export type Outcome = 'conformant' | 'failed' | 'partial' | 'running' | 'never';

const MAP: Record<Outcome, { icon: IconName; word: string }> = {
  conformant: { icon: 'check', word: 'Conformant' },
  failed: { icon: 'cross', word: 'Failed' },
  partial: { icon: 'warning', word: 'Partial' },
  running: { icon: 'running', word: 'Running' },
  never: { icon: 'circle', word: 'Never tested' },
};

/** Icon + word + color. The word is never optional. */
@Component({
  selector: 'span[mkStatusBadge]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'di-status', '[attr.data-status]': 'status()', '[attr.data-size]': 'size()' },
  template: `<svg mkIcon [name]="entry().icon" [size]="size() === 'sm' ? 14 : 16"></svg><span>{{ label() ?? entry().word }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<Outcome>();
  /** Overrides the default word. The word is always rendered. */
  readonly label = input<string>();
  readonly size = input<'md' | 'sm'>('md');

  protected entry() {
    return MAP[this.status()] ?? MAP.never;
  }
}
