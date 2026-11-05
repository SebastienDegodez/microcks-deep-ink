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

/**
 * Icon + word + color. The word is never optional.
 * Rich words (e.g. "Retrying · attempt <strong>2</strong> of 3") are projected as content; they replace label and the default word.
 */
@Component({
  selector: 'span[mkStatusBadge]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'status', '[attr.data-status]': 'status()', '[attr.data-size]': 'size()', '[attr.data-shape]': 'shape()' },
  template: `<svg mkIcon [name]="icon()" [size]="iconSize()"></svg><span><ng-content>{{ label() ?? word() }}</ng-content></span>`,
})
export class StatusBadgeComponent {
  readonly status = input.required<Outcome>();
  /** Overrides the default word. The word is always rendered. For markup, project content instead. */
  readonly label = input<string>();
  /** `lg`: page-level status (14px word, 15px icon, 2.6 stroke, normal line height). */
  readonly size = input<'md' | 'sm' | 'lg'>('md');
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
    if (this.size() === 'lg') return 15;
    return this.shape() === 'circled' ? (this.size() === 'sm' ? 14 : 15) : this.size() === 'sm' ? 13 : 14;
  }
}
