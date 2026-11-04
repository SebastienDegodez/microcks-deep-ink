import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { OpPickListComponent } from '@microcks-deep-ink/registry/angular/op-pick';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/OpPick',
  decorators: [moduleMetadata({ imports: [OpPickListComponent] })],
  parameters: itemParams(['op-pick', 'method-tag'], 'Operation picker cards. Toggle mode is a list of aria-pressed buttons (Service rail); radio mode is a radiogroup with arrow keys (Copilot).'),
};
export default meta;

const RAIL = [
  { id: 'list', method: 'GET', path: '/pastries', summary: 'List pastries by size', meta: '3 examples · +1 AI', end: '812', endLabel: 'Calls over 7 days: ' },
  { id: 'get', method: 'GET', path: '/pastries/{name}', summary: 'Get a pastry by its name', meta: '2 examples', end: '340', endLabel: 'Calls over 7 days: ' },
  { id: 'patch', method: 'PATCH', path: '/pastries/{name}', summary: 'Update a pastry price', meta: '2 examples', end: '96', endLabel: 'Calls over 7 days: ' },
];

export const ServiceRail: StoryObj = {
  name: 'Toggle (Service rail)',
  render: () => ({
    props: { options: RAIL, value: 'list' },
    template: `<div style="max-width: 360px"><mk-op-pick-list label="Operations" [options]="options" [(value)]="value" /></div>`,
  }),
};

export const Copilot: StoryObj = {
  name: 'Radio (Copilot)',
  render: () => ({
    props: {
      options: RAIL.map((o, i) => ({ id: o.id, method: o.method, path: o.path, summary: `${3 - i} examples`, end: i === 0 ? '+2 pending' : i === 1 ? '+1 accepted' : undefined, endTone: i === 0 ? 'warning' : 'success' })),
      value: 'list',
    },
    template: `<section aria-labelledby="op-story" style="max-width: 380px; display: flex; flex-direction: column; gap: 8px"><h2 id="op-story" class="section-label" data-size="sm">1 · Operation</h2><mk-op-pick-list mode="radio" labelledBy="op-story" [options]="options" [(value)]="value" /></section>`,
  }),
};
