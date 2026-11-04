import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SectionLabelDirective } from '@microcks-deep-ink/registry/angular/section-label';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/SectionLabel',
  argTypes: argTypesFor('section-label', ['SectionLabelDirective']),
  decorators: [moduleMetadata({ imports: [SectionLabelDirective] })],
  parameters: itemParams(['section-label'], 'A small uppercase muted label. Use a heading for a section, a label for a field, a span for a caption. The text stays in normal case in the DOM.'),
};
export default meta;

export const Uses: StoryObj = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; max-width: 360px">
        <h3 mkSectionLabel>Endpoints</h3>
        <div style="display: flex; flex-direction: column; gap: 4px">
          <label mkSectionLabel for="sl-url">Mock URL</label>
          <input id="sl-url" class="input" readonly value="https://microcks.acme.io/rest/API+Pastry/2.0" />
        </div>
        <h2 mkSectionLabel size="sm">1 · Operation</h2>
        <div mkSectionLabel size="sm" weight="regular" [split]="true"><span>3 operations</span><span>calls · 7 d</span></div>
      </div>
    `,
  }),
};
