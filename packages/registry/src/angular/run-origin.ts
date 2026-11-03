import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type RunOriginKind = 'ui' | 'api' | 'mock-url' | 'session';

const WORD: Record<RunOriginKind, string> = { ui: 'UI', api: 'API', 'mock-url': 'Mock URL', session: 'Session' };

/** Where a run was launched from. */
@Component({
  selector: 'span[mkRunOrigin]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'run-origin', '[attr.data-origin]': 'origin()' },
  template: `{{ word() }}@if (origin() === 'session' && sessionId()) {<code>{{ sessionId() }}</code>}`,
})
export class RunOriginComponent {
  readonly origin = input.required<RunOriginKind>();
  /** Shown with the session origin, e.g. "s-7f3a2c91". */
  readonly sessionId = input<string>();

  protected word(): string {
    return WORD[this.origin()];
  }
}
