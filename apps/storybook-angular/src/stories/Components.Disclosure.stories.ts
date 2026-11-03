import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DisclosureComponent } from '@microcks-deep-ink/registry/angular/disclosure';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Disclosure',
  decorators: [moduleMetadata({ imports: [DisclosureComponent] })],
  parameters: itemParams(['disclosure'], "A native `<details>`/`<summary>`: Enter and Space toggle it, the open state is exposed by the browser."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="stack" style="max-width:560px">
        <details mkDisclosure summary="Advanced options"><p style="margin:0">Dispatcher rules, constraints and delays.</p></details>
        <details mkDisclosure summary="Already open" defaultOpen><p style="margin:0">Open by default.</p></details>
      </div>
    `,
  }),
};
