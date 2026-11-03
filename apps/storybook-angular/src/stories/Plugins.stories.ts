import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DEEP_INK, getPluginHost } from '@microcks-deep-ink/angular';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import { SAMPLE_MANIFEST } from '@microcks-deep-ink/storybook-shared/fixtures';

const meta: Meta = {
  title: 'Plugins',
  decorators: [moduleMetadata({ imports: [DEEP_INK] })],
  loaders: [async () => ({ ready: await registerDemoPlugin() })],
  parameters: {
    docs: {
      description: {
        component:
          'Same demo plugin as in the React Storybook: a plain Web Component registered into the shared plugin host. `mk-plugin-slot` renders it in Angular without any adapter.',
      },
    },
  },
};
export default meta;

const eventService = { theme: 'dark', service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' } };
const restService = { theme: 'dark', service: { id: 'pastry', name: 'API Pastry', version: '2.0', protocol: 'REST' } };

export const CockpitWidgets: StoryObj = {
  name: 'Slot · cockpit.widgets',
  render: () => ({
    props: { ctx: eventService },
    template: `<mk-panel heading="Cockpit" style="max-width:520px;display:block"><mk-plugin-slot point="cockpit.widgets" [context]="ctx" [outlined]="true"></mk-plugin-slot></mk-panel>`,
  }),
};

export const ConditionalTab: StoryObj = {
  name: 'Slot · service.tabs (when)',
  render: () => ({
    props: { ev: eventService, rest: restService },
    template: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <mk-panel heading="EVENT service"><mk-plugin-slot point="service.tabs" [context]="ev" [outlined]="true"><span class="di-note">No plugin tab</span></mk-plugin-slot></mk-panel>
        <mk-panel heading="REST service"><mk-plugin-slot point="service.tabs" [context]="rest" [outlined]="true"><span class="di-note">No plugin tab: the contribution's when filter only accepts EVENT services.</span></mk-plugin-slot></mk-panel>
      </div>`,
  }),
};

export const NavContribution: StoryObj = {
  name: 'Slot · nav.items',
  render: () => ({ template: `<div style="width:240px;height:600px"><mk-side-nav active="cockpit"></mk-side-nav></div>` }),
};

export const Marketplace: StoryObj = {
  name: 'Installed plugins',
  render: () => ({
    props: { list: getPluginHost().list(), manifest: JSON.stringify(SAMPLE_MANIFEST, null, 2) },
    template: `
      <div class="di-col" style="max-width:640px">
        @for (m of list; track m.id) {
          <mk-panel [heading]="m.name" [subheading]="m.id + ' · ' + m.version + ' · Microcks ' + m.microcks">
            <div class="di-col">
              <span>{{ m.description }}</span>
              <div class="di-stack">
                @for (p of m.protocols; track p) { <mk-api-badge [protocol]="p" [name]="m.name" [version]="m.version"></mk-api-badge> }
                <mk-api-badge label="frontend" [value]="m.frontend?.contributes?.join(', ')" status="info"></mk-api-badge>
              </div>
            </div>
          </mk-panel>
        }
        <pre style="font:var(--type-code);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-panel);padding:16px;overflow:auto;color:var(--text-secondary)">{{ manifest }}</pre>
      </div>`,
  }),
};
