import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DialogComponent, DialogFooterDirective } from '@microcks-deep-ink/registry/angular/dialog';
import { ButtonDirective } from '@microcks-deep-ink/registry/angular/button';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Dialog',
  decorators: [moduleMetadata({ imports: [DialogComponent, DialogFooterDirective, ButtonDirective] })],
  parameters: itemParams(['dialog', 'button'], "A native `<dialog>` opened with `showModal()`: focus is trapped by the browser, Escape closes it and focus returns to the opener."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { open: false },
    template: `
      <button mkButton variant="primary" (click)="open = true">Import a contract</button>
      <dialog mkDialog [(open)]="open" title="Import a contract" description="Choose an OpenAPI, AsyncAPI, gRPC or GraphQL file.">
        <p style="margin:0">Drag a file here or choose one.</p>
        <div mkDialogFooter>
          <button mkButton variant="ghost" (click)="open = false">Cancel</button>
          <button mkButton variant="primary" (click)="open = false">Import</button>
        </div>
      </dialog>
    `,
  }),
};

export const Destructive: StoryObj = {
  render: () => ({
    props: { open: false },
    template: `
      <button mkButton variant="danger" (click)="open = true">Delete service</button>
      <dialog mkDialog [(open)]="open" title="Delete API Pastry 2.0?" description="The service, its examples and its test history are removed. This cannot be undone.">
        <p style="margin:0">Type the service name to confirm in a real product.</p>
        <div mkDialogFooter>
          <button mkButton variant="ghost" (click)="open = false">Cancel</button>
          <button mkButton variant="danger" (click)="open = false">Delete</button>
        </div>
      </dialog>
    `,
  }),
};
