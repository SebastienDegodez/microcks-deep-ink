import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { Dialog } from '@microcks-deep-ink/registry/react/dialog';
import { itemParams } from './_meta';

export default {
  title: 'Components/Dialog',
  parameters: itemParams(['dialog', 'button'], 'A native `<dialog>` opened with `showModal()`: focus is trapped by the browser, Escape closes it and focus returns to the opener.'),
} satisfies Meta;

function Demo({ danger }: { danger?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={danger ? 'danger' : 'primary'} onClick={() => setOpen(true)}>
        {danger ? 'Delete service' : 'Import a contract'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={danger ? 'Delete API Pastry 2.0?' : 'Import a contract'}
        description={danger ? 'The service, its examples and its test history are removed. This cannot be undone.' : 'Choose an OpenAPI, AsyncAPI, gRPC or GraphQL file.'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant={danger ? 'danger' : 'primary'} onClick={() => setOpen(false)}>{danger ? 'Delete' : 'Import'}</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>{danger ? 'Type the service name to confirm in a real product.' : 'Drag a file here or choose one.'}</p>
      </Dialog>
    </>
  );
}

export const Default: StoryObj = { render: () => <Demo /> };
function SizeDemo({ size, closeOnBackdrop }: { size: 'sm' | 'lg'; closeOnBackdrop?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{`Open the ${size === 'sm' ? 'small' : 'large'} dialog`}</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size={size}
        closeOnBackdrop={closeOnBackdrop}
        title={size === 'sm' ? 'Discard changes?' : 'Operation details'}
        description={closeOnBackdrop ? 'A click on the backdrop closes this dialog.' : undefined}
        footer={<Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>}
      >
        <p style={{ margin: 0 }}>{size === 'sm' ? 'Your edits are not saved.' : 'A wide dialog for forms and tables.'}</p>
      </Dialog>
    </>
  );
}

/** `size="sm"` for confirmations, `size="lg"` for wide content. `closeOnBackdrop` also closes on a click outside. */
export const Sizes: StoryObj = {
  render: () => (
    <div className="inline">
      <SizeDemo size="sm" closeOnBackdrop />
      <SizeDemo size="lg" />
    </div>
  ),
};

export const Destructive: StoryObj = { render: () => <Demo danger /> };
