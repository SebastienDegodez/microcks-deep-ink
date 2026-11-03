import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MenuComponent } from '@microcks-deep-ink/registry/angular/menu';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Menu',
  decorators: [moduleMetadata({ imports: [MenuComponent] })],
  parameters: itemParams(['menu', 'button'], "A disclosure menu on the native `popover` attribute: the trigger is a button with `aria-expanded`, Escape and click outside close it natively. It is not an ARIA `role=\"menu\"` application menu."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: {
      items: [
        { id: 'run', label: 'Run test', onSelect: () => undefined },
        { id: 'export', label: 'Export contract', onSelect: () => undefined },
        { id: 'docs', label: 'Open docs', href: '#docs' },
        { id: 'delete', label: 'Delete service', danger: true, onSelect: () => undefined },
      ],
    },
    template: `
<mk-menu label="Actions" [items]="items" />
    `,
  }),
};

export const IconOnly: StoryObj = {
  name: "Icon only",
  render: () => ({
    props: { items: [{ id: 'a', label: 'Duplicate' }, { id: 'b', label: 'Archive', disabled: true }] },
    template: `
<mk-menu label="More actions" icon="more" iconOnly variant="ghost" size="sm" [items]="items" />
    `,
  }),
};
