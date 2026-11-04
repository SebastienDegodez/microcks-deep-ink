import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { RESULT_BOX } from '@microcks-deep-ink/registry/angular/result-box';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/ResultBox',
  argTypes: argTypesFor('result-box'),
  decorators: [moduleMetadata({ imports: [...RESULT_BOX, ButtonDirective] })],
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

/** `tone="warning"`, a custom `icon`, `dismissLabel`, and `live="off"` for a box that is already on screen at load. */
export const WarningDismissible: StoryObj = {
  name: 'Warning, dismissible, not announced',
  render: () => ({
    template: `
      <div style="max-width:560px">
        <div mkResultBox tone="warning" icon="spark" title="Partial result" live="off" [dismissible]="true" dismissLabel="Dismiss the partial result">2 of 12 operations were skipped.</div>
      </div>
    `,
  }),
};

/** `[bordered]="false"` and `surface="raised"`: a flat note on the raised fill, as the Agent test verdict. */
export const FlatRaised: StoryObj = {
  name: 'Not bordered, raised (verdict)',
  render: () => ({
    template: `
      <div style="max-width:720px">
        <div mkResultBox tone="danger" icon="cross" title="The agent answered a canceled task" [bordered]="false" surface="raised" live="off">tasks/cancel returned 200, then message/send on the same task id returned a new artifact. A canceled task must stay terminal.</div>
      </div>
    `,
  }),
};
