import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ChipComponent } from '@microcks-deep-ink/registry/angular/chip';
import { FILTER_BAR } from '@microcks-deep-ink/registry/angular/filter-bar';
import { SegmentedComponent } from '@microcks-deep-ink/registry/angular/segmented';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/FilterBar',
  decorators: [moduleMetadata({ imports: [...FILTER_BAR, ChipComponent, SegmentedComponent] })],
  parameters: itemParams(['filter-bar', 'chip', 'segmented'], "A named box of filter rows: a search field, titled rows of chips or segmented controls, and a Reset that writes the number of active filters."),
};
export default meta;

export const Catalogue: StoryObj = {
  render: () => ({
    props: {
      q: '',
      result: 'all',
      proto: null as string | null,
      protos: [['REST', 4], ['SOAP', 1], ['EVENT', 2], ['GRAPHQL', 1]],
      results: [
        { id: 'all', label: 'All', count: 11, dot: 'neutral' },
        { id: 'ok', label: 'Conformant', count: 3, dot: 'success' },
        { id: 'ko', label: 'Failing', count: 5, dot: 'danger' },
      ],
    },
    template: `
      <section mkFilterBar label="Catalogue filters" style="max-width: 1100px">
        <div mkFilterRow>
          <mk-filter-search label="Search APIs and services" [(value)]="q" />
          <mk-segmented label="Last test" [options]="results" [(value)]="result" />
        </div>
        <div mkFilterRow title="Protocol">
          @for (p of protos; track p[0]) {
            <button mkChip [protocol]="p[0]" [count]="p[1]" [pressed]="proto === p[0]" (click)="proto = proto === p[0] ? null : p[0]">{{ p[0] }}</button>
          }
          <button mkFilterReset [count]="(q ? 1 : 0) + (result !== 'all' ? 1 : 0) + (proto ? 1 : 0)" (click)="q = ''; result = 'all'; proto = null"></button>
        </div>
      </section>
    `,
  }),
};
