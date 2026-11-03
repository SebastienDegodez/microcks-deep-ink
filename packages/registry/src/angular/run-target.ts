import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChipComponent } from './chip';

export type RunTargetKind = 'mocks' | 'implementations' | 'mixed';

const WORD: Record<RunTargetKind, string> = { mocks: 'Mocks', implementations: 'Implementations', mixed: 'Mixed' };

/** What a workflow run calls. Mixed is a proposal beyond the POC and says so. */
@Component({
  selector: 'span[mkRunTarget]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChipComponent],
  host: { class: 'di-run-target', '[attr.data-target]': 'target()' },
  template: `{{ word() }}@if (target() === 'mixed') {<span mkChip tone="warning" variant="dashed">Proposed · beyond POC</span>}`,
})
export class RunTargetComponent {
  readonly target = input.required<RunTargetKind>();

  protected word(): string {
    return WORD[this.target()];
  }
}
