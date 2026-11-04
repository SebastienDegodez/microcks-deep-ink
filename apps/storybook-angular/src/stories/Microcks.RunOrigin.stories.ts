import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { RunOriginComponent } from '@microcks-deep-ink/registry/angular/run-origin';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Microcks/RunOrigin',
  argTypes: argTypesFor('run-origin', ['RunOriginComponent']),
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

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('run-origin', 'RunOriginComponent', { origin: 'ui' }, '');
