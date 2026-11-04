import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Button',
  decorators: [moduleMetadata({ imports: [ButtonDirective] })],
  parameters: itemParams(['button'], "A sturdy, near-square native `<button>`. One primary per task region. The medium size is 44px high; the small size (32px) is never used for the primary action of a page."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <button mkButton variant="primary">Run test</button>
        <button mkButton>Cancel</button>
        <button mkButton variant="ghost">Skip</button>
        <button mkButton variant="link" icon="copy">Copy</button>
        <button mkButton variant="danger">Delete service</button>
      </div>
    `,
  }),
};

export const Sizes: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <button mkButton size="md">Medium (44px)</button>
        <button mkButton size="sm">Small (32px)</button>
      </div>
    `,
  }),
};

export const WithIcon: StoryObj = {
  name: "Icons",
  render: () => ({
    template: `
      <div class="inline">
        <button mkButton variant="primary" icon="play">Run test</button>
        <button mkButton icon="upload">Import</button>
        <button mkButton iconOnly icon="trash" aria-label="Delete example"></button>
      </div>
    `,
  }),
};

export const States: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <button mkButton disabled>Disabled</button>
        <button mkButton loading>Running</button>
        <button mkButton variant="danger" confirm>Confirm delete</button>
      </div>
    `,
  }),
};

export const AsLink: StoryObj = {
  name: "As a link",
  render: () => ({
    template: `
<a mkButton href="#service" variant="primary">Open service</a>
    `,
  }),
};
