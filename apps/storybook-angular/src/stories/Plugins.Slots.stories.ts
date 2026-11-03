import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PluginSlotDirective } from '@microcks-deep-ink/registry/angular/plugin-slot';
import { PanelComponent, PanelActionsDirective } from '@microcks-deep-ink/registry/angular/panel';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import { itemParams } from './_meta';

const EVENT_SERVICE = { theme: 'dark' as const, service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' as const } };
const REST_SERVICE = { theme: 'dark' as const, service: { id: 'pastry', name: 'API Pastry', version: '2.0', protocol: 'REST' as const } };

const meta: Meta = {
  title: 'Plugins/Slots',
  decorators: [moduleMetadata({ imports: [PluginSlotDirective, PanelComponent, PanelActionsDirective], schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  loaders: [async () => ({ ready: await registerDemoPlugin() })],
  parameters: itemParams(['plugin-slot', 'panel', 'api-badge', 'live-indicator'], "The demo plugin is a plain Web Component registered into the shared plugin host. `plugin-slot` renders it in light DOM, so it looks like the app through the HTML recipes (`live-indicator`, `api-badge`). The same plugin renders in the React Storybook."),
};
export default meta;

export const CockpitWidgets: StoryObj = {
  name: "Slot \u00b7 cockpit.widgets",
  render: () => ({
    props: { ctx: EVENT_SERVICE },
    template: `
      <section mkPanel title="Cockpit" style="max-width:520px;display:block">
        <plugin-slot point="cockpit.widgets" [context]="ctx" outlined></plugin-slot>
      </section>
    `,
  }),
};

export const ConditionalTab: StoryObj = {
  name: "Slot \u00b7 service.tabs (when)",
  render: () => ({
    props: { ev: EVENT_SERVICE, rest: REST_SERVICE },
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px">
        <section mkPanel title="EVENT service">
          <plugin-slot point="service.tabs" [context]="ev" outlined><span class="sb-note">No plugin tab</span></plugin-slot>
        </section>
        <section mkPanel title="REST service">
          <plugin-slot point="service.tabs" [context]="rest" outlined><span class="sb-note">No plugin tab: the contribution's when filter only accepts EVENT services.</span></plugin-slot>
        </section>
      </div>
    `,
  }),
};
