import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { KbdDirective } from '@microcks-deep-ink/registry/angular/kbd';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Kbd',
  decorators: [moduleMetadata({ imports: [KbdDirective] })],
  parameters: itemParams(['kbd'], "The native `<kbd>` element for key names. Write the key in words where a symbol is ambiguous."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
<p style="margin:0">Press <kbd mkKbd>Ctrl</kbd> + <kbd mkKbd>K</kbd> to open the command bar, <kbd mkKbd>Esc</kbd> to close it.</p>
    `,
  }),
};
