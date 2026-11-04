import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { PanelComponent, PanelActionsDirective } from '@microcks-deep-ink/registry/angular/panel';
import { TabsComponent, TabPanelComponent } from '@microcks-deep-ink/registry/angular/tabs';
import { ApiBadgeComponent } from '@microcks-deep-ink/registry/angular/api-badge';
import { ConformanceBandComponent } from '@microcks-deep-ink/registry/angular/conformance-band';
import { OperationListDirective, OperationRowComponent } from '@microcks-deep-ink/registry/angular/operation-row';
import { StatusBadgeComponent } from '@microcks-deep-ink/registry/angular/status-badge';
import { DescriptionListComponent } from '@microcks-deep-ink/registry/angular/description-list';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { MockUrlComponent } from '@microcks-deep-ink/registry/angular/mock-url';
import { CONFORMANCE, MOCK_BASE, OPERATIONS, SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Patterns/Service page',
  argTypes: argTypesFor('panel', ['PanelComponent']),
  decorators: [moduleMetadata({ imports: [PanelComponent, PanelActionsDirective, TabsComponent, TabPanelComponent, ApiBadgeComponent, ConformanceBandComponent, OperationListDirective, OperationRowComponent, StatusBadgeComponent, DescriptionListComponent, ButtonDirective, MockUrlComponent] })],
  parameters: itemParams(['panel', 'tabs', 'api-badge', 'conformance-band', 'operation-row', 'status-badge', 'description-list', 'button'], "A service detail page built only from registry items: proof badges and conformance in the header, tabs for the sections, the operation list with the mock URL of the selected one.", { layout: 'padded' }),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: {
      outcomes: CONFORMANCE,
      tabs: SERVICE_TABS,
      tab: 'operations',
      ops: OPERATIONS as Array<{ method: string; path: string; meta: string; mockUrl?: string }>,
      sel: 1,
      about: [
        { term: 'Mock base URL', value: MOCK_BASE, mono: true },
        { term: 'Dispatcher', value: 'URI_PARTS', mono: true },
        { term: 'Source', value: 'openapi.yaml · imported 3 days ago' },
      ],
    },
    template: `
      <div class="sb-col" style="max-width:960px">
        <header class="sb-col">
          <h1 style="font:var(--type-section);margin:0">API Pastry</h1>
          <div class="inline">
            <span mkApiBadge protocol="REST" name="API Pastry" version="2.0"></span>
            <span mkStatusBadge status="partial" label="92 % conformant"></span>
            <span mkApiBadge label="last test" value="2 h ago"></span>
            <button mkButton variant="primary" icon="play">Run test</button>
          </div>
          <mk-conformance-band [outcomes]="outcomes" />
        </header>
        <mk-tabs label="Service sections" [items]="tabs" [(value)]="tab">
          @for (t of tabs; track t.id) {
            <div mkTabPanel [tab]="t.id">
              @if (t.id === 'operations') {
                <div class="sb-col">
                  <ul mkOperationList label="Operations of API Pastry 2.0">
                    @for (op of ops; track op.method + op.path; let i = $index) {
                      <li mkOperationRow [method]="op.method" [path]="op.path" [meta]="op.meta" [mockUrl]="op.mockUrl" [selected]="sel === i" interactive (rowSelect)="sel = i"></li>
                    }
                  </ul>
                  <section mkPanel title="About" [headingLevel]="2">
                    <dl mkDescriptionList [items]="about"></dl>
                  </section>
                </div>
              } @else {
                <p style="margin:0">Content of the {{ t.label }} tab.</p>
              }
            </div>
          }
        </mk-tabs>
      </div>
    `,
  }),
};
