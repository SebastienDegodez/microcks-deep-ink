import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { CopyButtonComponent } from '@microcks-deep-ink/registry/angular/copy-button';
import { argTypesFor, itemParams, playground } from './_meta';

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

export const IconOnly: StoryObj = {
  name: "Icon only",
  render: () => ({
    template: `
<mk-copy-button iconOnly label="Copy mock URL" value="http://microcks.local:8080/rest/API+Pastry/2.0/pastries" />
    `,
  }),
};

/** Interactive: every input is a control in the Controls panel. */
export const Playground: StoryObj = playground('copy-button', 'CopyButtonComponent', { value: 'http://localhost:8080/rest/API+Pastry/2.0.0', label: 'Copy URL', copiedLabel: 'Copied', size: 'md', variant: 'secondary', iconOnly: false }, '');
