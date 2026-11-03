import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MethodTagComponent } from '@microcks-deep-ink/registry/angular/method-tag';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/MethodTag',
  decorators: [moduleMetadata({ imports: [MethodTagComponent] })],
  parameters: itemParams(['method-tag'], "The operation verb in mono, always written out. The color only speeds up scanning."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
    template: `
      <div class="inline">
        @for (m of methods; track m) {
          <span mkMethodTag [method]="m"></span>
        }
        <span mkMethodTag method="SUBSCRIBE" protocol="EVENT"></span>
        <span mkMethodTag method="PUBLISH" protocol="EVENT"></span>
      </div>
    `,
  }),
};
