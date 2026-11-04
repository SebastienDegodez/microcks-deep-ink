import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PluginSlotDirective } from '@microcks-deep-ink/registry/angular/plugin-slot';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Elements/PluginSlot',
  decorators: [moduleMetadata({ imports: [PluginSlotDirective], schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  parameters: itemParams(['plugin-slot'], "An extension point. Contributions render in the light DOM, so plugins use the same CSS classes as the app. The fallback content shows when nothing contributes. The host component needs `schemas: [CUSTOM_ELEMENTS_SCHEMA]`."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { ctx: { theme: 'dark', service: { id: 'pastry', name: 'API Pastry', version: '2.0', protocol: 'REST' as const } } },
    template: `
      <div style="max-width:520px">
        <plugin-slot point="service.tabs" [context]="ctx" outlined><span class="sb-note">No plugin contributes to this slot.</span></plugin-slot>
      </div>
    `,
  }),
};

export const Fallback: StoryObj = {
  name: 'Fallback content',
  render: () => ({
    props: { ctx: { theme: 'dark', service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' as const } } },
    template: `
      <div style="max-width:520px">
        <plugin-slot point="operation.panels" [context]="ctx" outlined><span class="sb-note">No plugin contributes to this point: this is the slot fallback.</span></plugin-slot>
      </div>
    `,
  }),
};
