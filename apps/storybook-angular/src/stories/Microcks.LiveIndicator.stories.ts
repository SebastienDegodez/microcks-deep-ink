import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { LiveIndicatorComponent } from '@microcks-deep-ink/registry/angular/live-indicator';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Microcks/LiveIndicator',
  argTypes: argTypesFor('live-indicator', ['LiveIndicatorComponent']),
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
  name: "Small, inline, dot and paused label",
  render: () => ({
    template: `
      <div class="inline">
        <span mkLiveIndicator size="sm"></span>
        <span mkLiveIndicator variant="inline"></span>
        <span mkLiveIndicator variant="dot" label="live task"></span>
        <span mkLiveIndicator paused pausedLabel="paused · 2 new calls"></span>
      </div>
    `,
  }),
};

export const Box: StoryObj = {
  name: "Box (in place of a busy button)",
  render: () => ({
    template: `
      <div class="inline">
        <span mkLiveIndicator variant="box" label="live · installing 3 APIs"></span>
        <span mkLiveIndicator variant="box" size="lg" label="live · fetching and importing artifacts"></span>
      </div>
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('live-indicator', 'LiveIndicatorComponent', { label: 'live', paused: false, pausedLabel: 'paused', size: 'md', variant: 'pill' }, '');
