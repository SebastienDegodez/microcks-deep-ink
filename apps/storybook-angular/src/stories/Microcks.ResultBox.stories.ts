import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { ResultBoxComponent } from '@microcks-deep-ink/registry/angular/result-box';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/ResultBox',
  decorators: [moduleMetadata({ imports: [ResultBoxComponent, ButtonDirective] })],
  parameters: itemParams(['result-box', 'button'], 'A framed result line in a role="status" box. Keep it mounted before the result arrives so the text is announced; the tone icon is decorative.'),
};
export default meta;

export const Tones: StoryObj = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 720px">
        <div mkResultBox size="md" [dismissible]="true">Secret gitlab-bakery created.</div>
        <div mkResultBox>Imported · 1 created, 2 replaced<span mkResultBoxAction><a href="#/services">Open the Catalogue</a></span></div>
        <div mkResultBox tone="neutral" title="checkout-beer cannot run until beerCatalog is linked">
          Beer Catalog API 1.0 is not in Microcks yet: import beer-catalog-1.0-openapi.yaml first, or pick the API to link in the dialog.
          <span mkResultBoxAction><button mkButton size="sm" icon="link">Link source</button></span>
        </div>
        <div mkResultBox tone="info"><strong>Pastry orders events</strong> deleted. Services already discovered remain but are no longer updated.<span mkResultBoxAction><button mkButton size="sm">Undo</button></span></div>
        <div mkResultBox tone="danger">Export failed · the repository is read-only.</div>
      </div>
    `,
  }),
};
