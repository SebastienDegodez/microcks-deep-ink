import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SPLIT_PANE } from '@microcks-deep-ink/registry/angular/split-pane';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/SplitPane',
  argTypes: argTypesFor('split-pane'),
  decorators: [moduleMetadata({ imports: [...SPLIT_PANE] })],
  parameters: itemParams(['split-pane'], 'List + detail layout. The side pane grows to a cap, the main pane takes the rest and wraps under the list on narrow screens. The DOM order is the reading order.'),
};
export default meta;

const box = 'padding: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--canvas)';

export const ListAndDetail: StoryObj = {
  name: 'List and detail',
  render: () => ({
    template: `<div mkSplitPane><nav mkSplitPaneSide aria-label="Operations" style="${box}">GET /pastries · GET /pastries/&#123;name&#125; · PATCH /pastries/&#123;name&#125;</nav><section mkSplitPaneMain aria-label="Operation detail" style="${box}">Examples, request and response of the selected operation.</section></div>`,
  }),
};

/** `align="stretch"` makes both panes as tall as the taller one; `balanced` shares the width; `gap` sets the spacing. */
export const StretchAndBalanced: StoryObj = {
  name: 'Stretch, balanced and gap',
  render: () => ({
    template: `<div mkSplitPane align="stretch" [balanced]="true" gap="32px"><nav mkSplitPaneSide aria-label="Operations" style="${box}">Short list</nav><section mkSplitPaneMain aria-label="Detail" style="${box}"><p style="margin:0">The detail pane is longer.</p><p>Both panes end on the same line.</p></section></div>`,
  }),
};

export const DetailFirst: StoryObj = {
  name: 'Wide list, detail on the right (Traces, Hub)',
  render: () => ({
    template: `<div mkSplitPane sideWidth="400px" sideMax="560px" mainWidth="560px"><section mkSplitPaneMain aria-label="Calls" style="${box}">The list of calls takes the rest of the row.</section><aside mkSplitPaneSide aria-label="Call detail" style="${box}">The detail of the selected call.</aside></div>`,
  }),
};
