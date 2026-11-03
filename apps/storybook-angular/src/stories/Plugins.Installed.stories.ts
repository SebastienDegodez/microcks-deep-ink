import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { PanelComponent, PanelActionsDirective } from '@microcks-deep-ink/registry/angular/panel';
import { ApiBadgeComponent } from '@microcks-deep-ink/registry/angular/api-badge';
import { getPluginHost } from '@microcks-deep-ink/registry/angular/plugin-slot';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import { SAMPLE_MANIFEST } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Plugins/Installed plugins',
  decorators: [moduleMetadata({ imports: [PanelComponent, PanelActionsDirective, ApiBadgeComponent] })],
  loaders: [async () => ({ ready: await registerDemoPlugin() })],
  parameters: itemParams(['plugin-slot', 'panel', 'api-badge'], "What the shared plugin host knows about: the manifest of the demo plugin and the points it contributes to."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { list: getPluginHost().list(), manifest: JSON.stringify(SAMPLE_MANIFEST, null, 2) },
    template: `
      <div class="sb-col" style="max-width:640px">
        @for (m of list; track m.id) {
          <section mkPanel [title]="m.name">
            <div class="sb-col">
              <span class="sb-note">{{ m.id }} · {{ m.version }} · Microcks {{ m.microcks }}</span>
              <span>{{ m.description }}</span>
              <div class="sb-stack">
                @for (p of m.protocols; track p) {
                  <span mkApiBadge [protocol]="p" [name]="m.name" [version]="m.version"></span>
                }
                <span mkApiBadge label="frontend" [value]="(m.frontend?.contributes ?? []).join(', ')" status="info"></span>
              </div>
            </div>
          </section>
        }
        <pre class="sb-code" tabindex="0">{{ manifest }}</pre>
      </div>
    `,
  }),
};
