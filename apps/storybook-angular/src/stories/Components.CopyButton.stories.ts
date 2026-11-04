import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CopyButtonComponent } from '@microcks-deep-ink/registry/angular/copy-button';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Copy button',
  argTypes: argTypesFor('copy-button', ['CopyButtonComponent']),
  decorators: [moduleMetadata({ imports: [CopyButtonComponent] })],
  parameters: itemParams(['copy-button'], "Copies a value, then says so twice: the label switches for 2 seconds and a visually hidden polite live region announces \"Copied\" (or \"Copy failed\")."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
<mk-copy-button value="http://microcks.local:8080/rest/API+Pastry/2.0/pastries" />
    `,
  }),
};

/** `size` and `variant` come from the button; `copiedLabel` is the label after a successful copy. */
export const SizesAndVariants: StoryObj = {
  name: 'Sizes and variants',
  render: () => ({
    template: `
      <div class="inline">
        <mk-copy-button value="microcks test" size="sm" variant="ghost" />
        <mk-copy-button value="microcks test" size="compact" variant="outline" label="Copy command" copiedLabel="Command copied" />
        <mk-copy-button value="microcks test" size="lg" variant="primary" />
      </div>
    `,
  }),
};

export const IconOnly: StoryObj = {
  name: "Icon only",
  render: () => ({
    template: `
<mk-copy-button iconOnly label="Copy mock URL" value="http://microcks.local:8080/rest/API+Pastry/2.0/pastries" />
    `,
  }),
};
