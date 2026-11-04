import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CopyButtonComponent } from './copy-button';

let nextId = 0;

/**
 * "Run it from CI" panel: `<section mkCiPanel id="ci-panel" title="Run this test in your pipeline" [command]="cmd">`.
 * Project the pill with `[mkCiPanelPill]`, the hint with `[mkCiPanelHint]`, the footnote with `[mkCiPanelFoot]`.
 * Show it with `<button mkButton class="ci-panel-toggle" [attr.aria-expanded]="open" aria-controls="ci-panel">`.
 */
@Component({
  selector: 'section[mkCiPanel]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyButtonComponent],
  host: {
    class: 'ci-panel',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.data-dashed]': "dashed() ? '' : null",
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `
    <div class="ci-panel-head">
      <div class="ci-panel-text">
        <p class="ci-panel-title"><span [id]="titleId">{{ title() }}</span><ng-content select="[mkCiPanelPill]" /></p>
        <ng-content select="[mkCiPanelHint]" />
      </div>
      <mk-copy-button variant="outline" size="sm" [value]="command()" [label]="copyLabel()" />
    </div>
    <pre class="ci-panel-code"><code>{{ command() }}</code></pre>
    <ng-content select="[mkCiPanelFoot]" />
  `,
})
export class CiPanelComponent {
  readonly title = input.required<string>();
  /** The command, copied by the Copy button. It wraps. */
  readonly command = input.required<string>();
  /** Dashed frame (a projected, not-yet-available command). */
  readonly dashed = input(false, { transform: booleanAttribute });
  /** Label of the copy button (default "Copy"; "Copy command" on AgentTestRun). */
  readonly copyLabel = input('Copy');
  protected readonly titleId = `mk-ci-panel-${++nextId}`;
}
