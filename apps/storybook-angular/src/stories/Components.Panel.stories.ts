import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { PanelComponent, PanelActionsDirective } from '@microcks-deep-ink/registry/angular/panel';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Panel',
  argTypes: argTypesFor('panel', ['PanelComponent']),
  decorators: [moduleMetadata({ imports: [PanelComponent, PanelActionsDirective, ButtonDirective] })],
  parameters: itemParams(['panel', 'button'], "A `<section>` named by its heading through `aria-labelledby`. Pick `headingLevel` so the outline stays ordered."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <section mkPanel title="Mock URL" style="max-width:560px;display:block">
        <button mkPanelActions mkButton size="sm">Regenerate</button>
        <p style="margin:0">Panel body.</p>
      </section>
    `,
  }),
};

export const Flush: StoryObj = {
  render: () => ({
    template: `
      <section mkPanel title="Operations" [headingLevel]="3" flush style="max-width:560px;display:block">
        <p style="margin:0;padding:var(--space-4)">Flush removes the body padding, for tables and lists.</p>
      </section>
    `,
  }),
};

export const LabelTitle: StoryObj = {
  name: "Label title, large padding",
  render: () => ({
    template: `
      <section mkPanel title="Runner log" titleStyle="label" padding="lg" style="max-width:560px;display:block">
        <p style="margin:0">An uppercase 12px title and a 20px padding.</p>
      </section>
    `,
  }),
};
