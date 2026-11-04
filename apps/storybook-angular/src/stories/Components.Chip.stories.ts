import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ChipComponent } from '@microcks-deep-ink/registry/angular/chip';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Components/Chip',
  argTypes: argTypesFor('chip', ['ChipComponent']),
  decorators: [moduleMetadata({ imports: [ChipComponent] })],
  parameters: itemParams(['chip'], "Static labels are a `<span>`. A chip with `pressed` is a toggle `<button aria-pressed>`. A removable chip has a remove button named \"Remove <text>\"."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <span mkChip>neutral</span>
        <span mkChip tone="info">info</span>
        <span mkChip tone="success">success</span>
        <span mkChip tone="warning">warning</span>
        <span mkChip tone="danger">danger</span>
      </div>
    `,
  }),
};

export const Variants: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <span mkChip variant="solid" tone="info">solid</span>
        <span mkChip variant="outline" tone="info">outline</span>
        <span mkChip variant="dashed" tone="warning">Proposed · beyond POC</span>
        <span mkChip labelKey="owner">sebastien</span>
      </div>
    `,
  }),
};

export const Toggle: StoryObj = {
  render: () => ({
    props: { on: false },
    template: `
<button mkChip [pressed]="on" (click)="on = !on">REST only</button>
    `,
  }),
};

export const Removable: StoryObj = {
  render: () => ({
    props: {
      tags: ['pastry', 'bakery', 'v2'],
      remove(this: { tags: string[] }, t: string) {
        this.tags = this.tags.filter((x) => x !== t);
      },
    },
    template: `
      <div class="inline">
        @for (t of tags; track t) {
          <span mkChip removable (removed)="remove(t)">{{ t }}</span>
        }
        @if (tags.length === 0) {
          <span class="sb-note">No tags left.</span>
        }
      </div>
    `,
  }),
};

export const Filters: StoryObj = {
  name: "Filters (labels and protocols)",
  render: () => ({
    props: { proto: 'REST', label: 'domain=pastry', protos: [['REST', 4], ['SOAP', 1], ['EVENT', 2], ['GRAPHQL', 0]] },
    template: `
      <div class="stack">
        <div class="inline">
          @for (p of protos; track p[0]) {
            <button mkChip [protocol]="p[0]" [count]="p[1]" [pressed]="proto === p[0]" (click)="proto = proto === p[0] ? null : p[0]">{{ p[0] }}</button>
          }
        </div>
        <div class="inline">
          <button mkChip labelKey="domain" [count]="4" [pressed]="label === 'domain=pastry'" (click)="label = 'domain=pastry'">pastry</button>
          <button mkChip labelKey="domain" [count]="1" [pressed]="label === 'domain=movies'" (click)="label = 'domain=movies'">movies</button>
        </div>
        <div class="inline" role="group" aria-label="Categories">
          <button mkChip size="lg" [count]="8" [pressed]="true">All</button>
          <button mkChip size="lg" [count]="3" [pressed]="false">Samples</button>
          <button mkChip size="lg" [count]="1" [pressed]="false">Banking</button>
        </div>
        <div class="inline">
          <span mkChip size="sm" labelKey="domain">pastry</span>
          <span mkChip size="sm" labelKey="team">bakery</span>
        </div>
      </div>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('chip', 'ChipComponent', { tone: 'success', variant: 'solid', size: 'md', removable: false }, 'Conformant');
