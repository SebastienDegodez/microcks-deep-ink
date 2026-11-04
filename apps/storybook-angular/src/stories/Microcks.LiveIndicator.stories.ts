import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { LiveIndicatorComponent } from '@microcks-deep-ink/registry/angular/live-indicator';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/LiveIndicator',
  decorators: [moduleMetadata({ imports: [LiveIndicatorComponent] })],
  parameters: itemParams(['live-indicator'], "Marks a real-time stream only. It is not a status and not a live region: pair it with a Pause control (RGAA 13.8) and announce stream changes elsewhere. The dot is static under reduced motion."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
<span mkLiveIndicator></span>
    `,
  }),
};

export const Paused: StoryObj = {
  render: () => ({
    template: `
<span mkLiveIndicator paused></span>
    `,
  }),
};

export const CustomLabel: StoryObj = {
  name: "Custom label",
  render: () => ({
    template: `
<span mkLiveIndicator label="recording"></span>
    `,
  }),
};

export const SizesAndPausedLabel: StoryObj = {
  name: "Small, inline and paused label",
  render: () => ({
    template: `
      <div class="inline">
        <span mkLiveIndicator size="sm"></span>
        <span mkLiveIndicator variant="inline"></span>
        <span mkLiveIndicator paused pausedLabel="paused · 2 new calls"></span>
      </div>
    `,
  }),
};
