import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { LiveIndicatorComponent } from '@microcks-deep-ink/registry/angular/live-indicator';
import { STAT_CARD } from '@microcks-deep-ink/registry/angular/stat-card';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Microcks/StatCard',
  argTypes: argTypesFor('stat-card'),
  decorators: [moduleMetadata({ imports: [...STAT_CARD, LiveIndicatorComponent] })],
  parameters: itemParams(['stat-card', 'live-indicator'], "A key figure: a small heading (a real heading), the figure as text with its unit, and optional detail. The tone colours the figure only; the words carry the meaning."),
};
export default meta;

export const KeyFigures: StoryObj = {
  name: "Key figures",
  render: () => ({
    template: `
      <section mkStatGrid label="Key figures" style="max-width: 1000px">
        <section mkStatCard title="APIs & services" value="11" unit="29 operations"><a mkStatCardAction href="#/services">Catalogue</a></section>
        <section mkStatCard title="Mock invocations today" value="638" unit="requests">
          <span mkStatCardAction><span mkLiveIndicator variant="inline"></span></span>
          <p>1,322 async messages published · last request 12 s ago</p>
        </section>
        <section mkStatCard title="Tests · last 7 days" value="20" unit="runs"><a mkStatCardAction href="#/tests">History</a></section>
        <section mkStatCard title="Average conformance" value="78%" unit="current score" tone="warning">
          <a mkStatCardAction href="#/usage">Details</a>
          <p>Across 8 tested services · 3 never tested</p>
        </section>
      </section>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('stat-card', 'StatCardComponent', { title: 'Conformance', headingLevel: 2, value: '92', unit: '%', tone: 'success' }, '<p>Across 12 operations.</p>');
