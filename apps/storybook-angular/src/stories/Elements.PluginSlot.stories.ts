import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { PluginSlotDirective } from '@microcks-deep-ink/registry/angular/plugin-slot';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Elements/Plugin slot',
  argTypes: argTypesFor('plugin-slot', ['PluginSlotDirective']),
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
