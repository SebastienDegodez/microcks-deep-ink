import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon';
import type { IconName } from './icon';

export type Outcome = 'conformant' | 'failed' | 'partial' | 'running' | 'never';

const WORD: Record<Outcome, string> = {
  conformant: 'Conformant',
  failed: 'Failed',
  partial: 'Partial',
  running: 'Running',
  never: 'Never tested',
};

const ICON: Record<'circled' | 'bare', Record<Outcome, IconName>> = {
  circled: { conformant: 'check-circle', failed: 'x-circle', partial: 'warning', running: 'running', never: 'never-tested' },
  bare: { conformant: 'check', failed: 'cross', partial: 'warning', running: 'running', never: 'circle' },
};

/** Icon + word + color. The word is never optional. */
@Component({
  selector: 'span[mkStatusBadge]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'status', '[attr.data-status]': 'status()', '[attr.data-size]': 'size()', '[attr.data-shape]': 'shape()' },
  template: `<svg mkIcon [name]="icon()" [size]="iconSize()"></svg><span>{{ label() ?? word() }}</span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<Outcome>();
  /** Overrides the default word. The word is always rendered. */
  readonly label = input<string>();
  readonly size = input<'md' | 'sm'>('md');
  /**
   * `circled` (default): ringed icons for a summary (last test, last run); "never" is a dashed ring.
   * `bare`: plain check and cross for step and test outcomes.
   */
  readonly shape = input<'circled' | 'bare'>('circled');

  private known(): Outcome {
    return this.status() in WORD ? this.status() : 'never';
  }
  protected icon(): IconName {
    return ICON[this.shape()][this.known()];
  }
  protected word(): string {
    return WORD[this.known()];
  }
  protected iconSize(): number {
    return this.shape() === 'circled' ? (this.size() === 'sm' ? 14 : 15) : this.size() === 'sm' ? 13 : 14;
  }
}
