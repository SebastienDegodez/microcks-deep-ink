import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Button',
  argTypes: argTypesFor('button', ['ButtonDirective']),
  decorators: [moduleMetadata({ imports: [ButtonDirective] })],
  parameters: itemParams(['button'], "A sturdy, near-square native `<button>`. One primary per task region. The medium size is 40px high, large 44px (form footers); small (32px) and compact (34px) are never used for the primary action of a page."),
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
        <button mkButton variant="dashed" icon="plus">Add header</button>
        <button mkButton variant="danger">Delete service</button>
      </div>
    `,
  }),
};

export const FormFooter: StoryObj = {
  name: 'Form footer, inline delete',
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start">
        <div class="inline">
          <button mkButton variant="outline" size="lg">Cancel</button>
          <button mkButton variant="primary" size="lg" icon="play">Launch test</button>
          <button mkButton variant="primary" size="lg" icon="play" disabled>Launch test</button>
        </div>
        <div class="inline">
          <button mkButton variant="dashed" size="compact" icon="plus">Add header</button>
          <button mkButton variant="ghost" size="sm" tone="danger" icon="trash">Delete</button>
        </div>
      </div>
    `,
  }),
};

export const Sizes: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <button mkButton size="lg">Large (44px)</button>
        <button mkButton size="md">Medium (40px)</button>
        <button mkButton size="tile">Tile (36px)</button>
        <button mkButton size="compact">Compact (34px)</button>
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

export const CardFooter: StoryObj = {
  name: 'Card footer (tile, 36px)',
  render: () => ({
    template: `
      <div class="inline">
        <button mkButton variant="primary" size="tile" icon="download">Install</button>
        <a mkButton size="tile" href="#">View in catalogue</a>
      </div>
    `,
  }),
};
