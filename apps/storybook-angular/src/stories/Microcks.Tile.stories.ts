import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ApiBadgeComponent } from '@microcks-deep-ink/registry/angular/api-badge';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { TILE } from '@microcks-deep-ink/registry/angular/tile';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/Tile',
  argTypes: argTypesFor('tile'),
  decorators: [moduleMetadata({ imports: [...TILE, ApiBadgeComponent, ButtonDirective] })],
  parameters: itemParams(['tile', 'api-badge', 'button'], "A card in a wrapping grid. The title is the one link (or toggle button) of the tile, stretched over it, so the whole card is clickable without nesting controls. Footer controls stay separate."),
};
export default meta;

export const Packages: StoryObj = {
  name: "Hub packages (selectable)",
  render: () => ({
    props: {
      selected: 'banking',
      packages: [
        { id: 'banking', name: 'Open Banking', category: 'Banking', meta: '3 APIs · updated Oct 21, 2026', description: 'Accounts, payments and consents, with examples for every operation.', apis: [['REST', 'Accounts API', '1.2.0'], ['REST', 'Payments API', '1.1.0'], ['EVENT', 'Consent events', '0.3.0']], totals: '9 ops · 19 examples' },
        { id: 'pastry', name: 'Pastry samples', category: 'Samples', meta: '2 APIs · updated Sep 2, 2026', description: 'The bakery demo used across the Microcks docs.', apis: [['REST', 'API Pastry', '2.0'], ['GRAPHQL', 'Pastry graph', '1.0']], totals: '5 ops · 12 examples' },
        { id: 'telco', name: 'CAMARA', category: 'Telco', meta: '4 APIs · updated Aug 14, 2026', description: 'Network APIs of the CAMARA project: quality on demand, device location, SIM swap.', apis: [['REST', 'Quality on demand', '0.10.0']], totals: '14 ops · 40 examples' },
      ],
    },
    template: `
      <section mkTileGrid label="Packages" style="max-width: 760px">
        @for (p of packages; track p.id) {
          <article mkTile [title]="p.name" selectable [selected]="selected === p.id" (tileSelect)="selected = p.id">
            <span mkTileMeta>maintained by <strong>community</strong> · {{ p.meta }}</span>
            <span mkTileAside><span class="tile-tag">{{ p.category }}</span></span>
            <p>{{ p.description }}</p>
            <div class="tile-badges">
              @for (a of p.apis; track a[1]) {<span mkApiBadge size="sm" [protocol]="a[0]" [name]="a[1]" [version]="a[2]"></span>}
            </div>
            <div mkTileFooter>
              <button mkButton variant="primary" size="sm" icon="download">Install <span class="sr-only">{{ p.name }}</span></button>
              <span class="tile-footer-end">{{ p.totals }}</span>
            </div>
          </article>
        }
      </section>
    `,
  }),
};

export const Links: StoryObj = {
  name: "Link tiles (services)",
  render: () => ({
    template: `
      <section mkTileGrid label="Services" style="max-width: 760px">
        <article mkTile title="API Pastry 2.0" href="#/services/pastry2" [headingLevel]="2">
          <span mkTileMeta>OpenAPI 3.0.2 · 3 operations</span>
          <span mkTileAside><span class="tile-tag">REST</span></span>
          <p>List pastries by size, get a pastry by its name, and update its price.</p>
        </article>
        <article mkTile title="Pastry orders API 0.1.0" href="#/services/orders" [headingLevel]="2" selected>
          <span mkTileMeta>AsyncAPI 2.6 · Kafka</span>
          <span mkTileAside><span class="tile-tag">EVENT</span></span>
          <p>Order events published by the bakery.</p>
        </article>
      </section>
    `,
  }),
};

export const Static: StoryObj = {
  name: "Static tile",
  render: () => ({
    template: `
      <div style="max-width: 360px">
        <article mkTile title="Pastry concierge">
          <span mkTileMeta>A2A Agent Card · spec 1.0</span>
          <p>No link: the tile is a plain article.</p>
        </article>
      </div>
    `,
  }),
};
