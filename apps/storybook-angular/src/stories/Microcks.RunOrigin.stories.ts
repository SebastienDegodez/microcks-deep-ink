import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { RunOriginComponent } from '@microcks-deep-ink/registry/angular/run-origin';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/RunOrigin',
  decorators: [moduleMetadata({ imports: [RunOriginComponent] })],
  parameters: itemParams(['run-origin'], "Where a run was started from: UI, API, Mock URL or a session."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <span mkRunOrigin origin="ui"></span>
        <span mkRunOrigin origin="api"></span>
        <span mkRunOrigin origin="mock-url"></span>
        <span mkRunOrigin origin="session" sessionId="s-7f3a2c91"></span>
      </div>
    `,
  }),
};
