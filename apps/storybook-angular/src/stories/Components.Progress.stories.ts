import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ProgressComponent, MeterComponent } from '@microcks-deep-ink/registry/angular/progress';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Progress',
  argTypes: argTypesFor('progress', ['ProgressComponent', 'MeterComponent']),
  decorators: [moduleMetadata({ imports: [ProgressComponent, MeterComponent] })],
  parameters: itemParams(['progress'], "Native `<progress>` and `<meter>`, each with a visible label. Without a value the progress is indeterminate."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:420px">
        <mk-progress label="Importing contract" [value]="65" />
        <mk-progress label="Waiting for the broker" />
      </div>
    `,
  }),
};

/** `max` for a count, and `Meter.min` for a range that does not start at zero. */
export const CustomRange: StoryObj = {
  name: 'Custom range',
  render: () => ({
    template: `
      <div class="stack" style="max-width:420px">
        <mk-progress label="Operations tested" [value]="8" [max]="12" />
        <mk-meter label="Latency" [value]="140" [min]="50" [max]="500" [low]="200" [high]="350" [optimum]="80" valueText="140 ms" />
      </div>
    `,
  }),
};

export const MeterStory: StoryObj = {
  name: "Meter",
  render: () => ({
    template: `
      <div class="stack" style="max-width:420px">
        <mk-meter label="Operations passing" [value]="11" [max]="12" [low]="8" [high]="11" [optimum]="12" valueText="11 of 12" />
        <mk-meter label="Operations failing too much" [value]="5" [max]="12" [low]="8" [high]="11" [optimum]="12" valueText="5 of 12" />
      </div>
    `,
  }),
};
