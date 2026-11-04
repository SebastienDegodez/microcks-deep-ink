import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ProjectionPillComponent } from '@microcks-deep-ink/registry/angular/projection-pill';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/ProjectionPill',
  decorators: [moduleMetadata({ imports: [ProjectionPillComponent] })],
  parameters: itemParams(['projection-pill'], 'Marks a proposed feature that does not exist in Microcks today. The visible words carry the meaning; the title only adds detail.'),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <span mkProjectionPill title="A2A does not exist in Microcks today: this screen projects a protocol module for v2">Projection · v2 module</span>
        <span mkProjectionPill>Projection · proposed CLI</span>
      </div>
    `,
  }),
};
