import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ConformanceMatrixComponent, cellKey } from '@microcks-deep-ink/registry/angular/conformance-matrix';
import { MATRIX_COLUMNS, MATRIX_GROUPS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/ConformanceMatrix',
  argTypes: argTypesFor('conformance-matrix', ['ConformanceMatrixComponent']),
  decorators: [moduleMetadata({ imports: [ConformanceMatrixComponent] })],
  parameters: itemParams(['conformance-matrix', 'icon'], 'Checks by columns (here the three A2A transports) as a real table. Each cell writes its result with a glyph and a word. A finished cell is a button that selects it; queued and running cells are plain text. A cell without a column spans all of them.'),
};
export default meta;

const FOOTER = { label: 'Conversations passed', cells: [{ text: '2/3', tone: 'danger' as const }, { text: '1/3' }, { text: '2/3', tone: 'danger' as const }] };

export const Default: StoryObj = {
  render: () => ({
    props: { columns: MATRIX_COLUMNS, groups: MATRIX_GROUPS, footer: FOOTER },
    template: `<mk-conformance-matrix caption="Conformance matrix" [columns]="columns" [groups]="groups" [footer]="footer" />`,
  }),
};

export const SelectableCells: StoryObj = {
  render: () => ({
    props: {
      columns: MATRIX_COLUMNS,
      groups: MATRIX_GROUPS,
      footer: FOOTER,
      selected: cellKey('eclair-size-m', 'http') as string | undefined,
      pick(this: { selected: string | undefined }, key: string | undefined) {
        this.selected = key;
      },
    },
    template: `
      <div class="sb-col">
        <mk-conformance-matrix caption="Conformance matrix" selectable [columns]="columns" [groups]="groups" [footer]="footer" [selectedKey]="selected" (cellSelect)="pick($event)" />
        <p role="status">{{ selected ? 'Detail of ' + selected.replace('|', ' on ') : 'Select a finished cell to see the exchange.' }}</p>
      </div>
    `,
  }),
};
