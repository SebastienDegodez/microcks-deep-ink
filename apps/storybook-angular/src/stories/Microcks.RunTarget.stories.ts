import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { RunTargetComponent } from '@microcks-deep-ink/registry/angular/run-target';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/RunTarget',
  decorators: [moduleMetadata({ imports: [RunTargetComponent] })],
  parameters: itemParams(['run-target', 'chip'], "What a workflow run calls. \"Mixed\" is a proposal beyond the POC and says so in text, with a dashed chip."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="di-inline">
        <span mkRunTarget target="mocks"></span>
        <span mkRunTarget target="implementations"></span>
        <span mkRunTarget target="mixed"></span>
      </div>
    `,
  }),
};
