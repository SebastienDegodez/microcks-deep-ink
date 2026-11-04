import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { CiPanelComponent } from '@microcks-deep-ink/registry/angular/ci-panel';
import { ProjectionPillComponent } from '@microcks-deep-ink/registry/angular/projection-pill';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/CiPanel',
  decorators: [moduleMetadata({ imports: [ButtonDirective, CiPanelComponent, ProjectionPillComponent] })],
  parameters: itemParams(['ci-panel', 'copy-button', 'button'], '"Run it from CI": a region named by its title, shown by a toggle button with `aria-expanded` and `aria-controls`. Copy announces its result; the command wraps.'),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: {
      open: true,
      cmd: "microcks test 'Pastry Concierge:1.0' https://concierge.acme.io/a2a A2A_CONFORMANCE \\\n  --microcksURL=https://microcks.acme.io/api/ --waitFor=30sec",
    },
    template: `
      <div class="stack" style="max-width: 720px">
        <div class="inline">
          <button mkButton class="ci-panel-toggle" icon="code" [attr.aria-expanded]="open" aria-controls="sb-ci-ng" (click)="open = !open">Run it from CI</button>
        </div>
        @if (open) {
          <section mkCiPanel id="sb-ci-ng" dashed title="Run this test in your pipeline" [command]="cmd">
            <span mkCiPanelPill mkProjectionPill>Projection · proposed CLI</span>
            <p mkCiPanelHint class="ci-panel-hint">Proposed, not available today: the existing microcks test command with the new runner name. It exits non-zero when a check fails.</p>
            <p mkCiPanelFoot class="ci-panel-foot">Add --keycloakClientId and --keycloakClientSecret when your Microcks instance has authentication on.</p>
          </section>
        }
      </div>
    `,
  }),
};
