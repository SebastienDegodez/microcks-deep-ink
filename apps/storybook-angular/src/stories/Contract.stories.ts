import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { fn } from 'storybook/test';
import { DEEP_INK } from '@microcks-deep-ink/angular';
import { CATALOGUE_COLUMNS, CATALOGUE_ROWS, CONFORMANCE, MOCK_BASE, OPERATIONS } from '@microcks-deep-ink/storybook-shared/fixtures';

const meta: Meta = { title: 'Contract', decorators: [moduleMetadata({ imports: [DEEP_INK] })] };
export default meta;

export const MockUrl: StoryObj = {
  render: () => ({
    props: { url: `${MOCK_BASE}/pastries/Millefeuille`, copied: fn() },
    template: `<mk-mock-url [url]="url" method="GET" mcpTool="get_pastry_by_name" (mkCopy)="copied($event.detail)"></mk-mock-url>`,
  }),
  parameters: { docs: { description: { story: 'The live endpoint of a mock, one click from the clipboard. "Copied" for 2 s, no toast.' } } },
};

export const OperationList: StoryObj = {
  render: () => ({
    props: { ops: OPERATIONS, base: MOCK_BASE, sel: '/pastries/{name}' },
    template: `
      <mk-panel [flush]="true" style="max-width:640px">
        @for (o of ops; track o.method + o.path) {
          <mk-operation-row [method]="o.method" [path]="o.path" [meta]="o.meta" [mockUrl]="base + o.path"
            [selected]="sel === o.path && o.method === 'GET'" (mkSelect)="sel = $event.detail.path"></mk-operation-row>
        }
      </mk-panel>`,
  }),
};

export const AiGhostRow: StoryObj = {
  render: () => ({
    props: { accept: fn(), edit: fn(), reject: fn() },
    template: `
      <div style="max-width:640px">
        <mk-ai-ghost-row (mkAccept)="accept()" (mkEdit)="edit()" (mkReject)="reject()">Tartelette Framboise · 200</mk-ai-ghost-row>
      </div>`,
  }),
};

export const ConformanceBand: StoryObj = {
  name: 'Proof / ConformanceBand',
  render: () => ({
    props: { a: CONFORMANCE, b: ['pass', 'fail', 'fail', 'pass', 'untested'] },
    template: `
      <div class="di-col">
        <mk-conformance-band [outcomes]="a"></mk-conformance-band>
        <mk-conformance-band size="mini" [outcomes]="a"></mk-conformance-band>
        <mk-conformance-band [outcomes]="b"></mk-conformance-band>
      </div>`,
  }),
};

export const Catalogue: StoryObj = {
  render: () => ({
    props: { cols: CATALOGUE_COLUMNS, rows: CATALOGUE_ROWS, clicked: fn() },
    template: `<mk-data-table [columns]="cols" [rows]="rows" [interactive]="true" selectedKey="pastry" (mkRowClick)="clicked($event.detail)"></mk-data-table>`,
  }),
};

export const EmptyTable: StoryObj = {
  render: () => ({
    props: { cols: CATALOGUE_COLUMNS },
    template: `<mk-data-table [columns]="cols" [rows]="[]" emptyText="No service yet. Import a contract to create your first mock."></mk-data-table>`,
  }),
};

export const DropZone: StoryObj = {
  render: () => ({
    props: { files: fn() },
    template: `<mk-drop-zone (mkFiles)="files($event.detail)"></mk-drop-zone>`,
  }),
};

export const ServicePanel: StoryObj = {
  name: 'Composition / Service panel',
  render: () => ({
    props: { url: `${MOCK_BASE}/pastries/Millefeuille`, conf: CONFORMANCE },
    template: `
      <mk-panel heading="API Pastry 2.0" subheading="3 operations · URI_PARTS dispatcher" style="max-width:720px">
        <div class="di-col">
          <mk-mock-url [url]="url" mcpTool="get_pastry_by_name"></mk-mock-url>
          <mk-conformance-band [outcomes]="conf"></mk-conformance-band>
        </div>
      </mk-panel>`,
  }),
};
