import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ChipComponent } from '@microcks-deep-ink/registry/angular/chip';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Chip',
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
