import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { OperationListDirective, OperationRowComponent } from '@microcks-deep-ink/registry/angular/operation-row';
import { OPERATIONS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/OperationRow',
  argTypes: argTypesFor('operation-row', ['OperationListDirective', 'OperationRowComponent']),
  decorators: [moduleMetadata({ imports: [OperationListDirective, OperationRowComponent] })],
  parameters: itemParams(['operation-row', 'method-tag', 'mock-url'], "A list of operations. Each row is a link or a button (never a clickable `<div>`); the selected row has `aria-current=\"true\"` and reveals its mock URL."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { ops: OPERATIONS as Array<{ method: string; path: string; meta: string; mockUrl?: string }>, sel: 1 },
    template: `
      <div style="max-width:720px">
        <ul mkOperationList label="Operations of API Pastry 2.0">
          @for (op of ops; track op.method + op.path; let i = $index) {
            <li mkOperationRow [method]="op.method" [path]="op.path" [meta]="op.meta" [mockUrl]="op.mockUrl" [selected]="sel === i" interactive (rowSelect)="sel = i"></li>
          }
        </ul>
      </div>
    `,
  }),
};

export const AsLinks: StoryObj = {
  name: "Links",
  render: () => ({
    props: { ops: OPERATIONS },
    template: `
      <div style="max-width:720px">
        <ul mkOperationList label="Operations of API Pastry 2.0">
          @for (op of ops; track op.method + op.path; let i = $index) {
            <li mkOperationRow [method]="op.method" [path]="op.path" [meta]="op.meta" [href]="'#op-' + i" [selected]="i === 0"></li>
          }
        </ul>
      </div>
    `,
  }),
};
