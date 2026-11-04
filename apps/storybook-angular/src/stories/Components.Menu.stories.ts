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

/** `align="end"` opens the list towards the start of the page, for a menu at the right edge. */
export const AlignEnd: StoryObj = {
  name: 'Aligned to the end',
  render: () => ({
    props: { items: [{ id: 'edit', label: 'Edit' }, { id: 'delete', label: 'Delete', danger: true, separatorBefore: true }] },
    template: `<div style="display:flex;justify-content:flex-end;min-height:180px"><mk-menu label="Actions" align="end" [items]="items" /></div>`,
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

export const SeparatorAndDescription: StoryObj = {
  name: "Separator and description",
  render: () => ({
    props: {
      items: [
        { id: 'copy', label: 'Copy workflowId' },
        { id: 'dl', label: 'Download Arazzo document' },
        { id: 'del', label: 'Delete workflow', danger: true, disabled: true, separatorBefore: true, description: 'Workflows are removed with their Arazzo document.' },
      ],
    },
    template: `<mk-menu label="More actions" icon="more-vertical" iconOnly [items]="items" />`,
  }),
};
