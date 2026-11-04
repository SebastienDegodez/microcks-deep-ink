import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Button } from './button';
import { Dialog } from './dialog';

function Harness({ autofocus = false, onClose }: { autofocus?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        title="Delete API Pastry?"
        description="This cannot be undone."
        footer={
          <>
            <Button data-autofocus={autofocus ? '' : undefined}>Cancel</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      >
        <label>
          Reason <input type="text" />
        </label>
      </Dialog>
    </>
  );
}

const opener = () => screen.getByRole('button', { name: 'Open dialog' });

describe('Dialog', () => {
  it('opens as a modal with a name and a description', () => {
    render(<Harness />);
    fireEvent.click(opener());
    const dialog = document.querySelector('dialog')!;
    expect(dialog.hasAttribute('open')).toBe(true);
    const title = screen.getByRole('heading', { name: 'Delete API Pastry?' });
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe('This cannot be undone.');
  });

  it('moves focus to the first control of the body', () => {
    render(<Harness />);
    fireEvent.click(opener());
    expect(document.activeElement?.tagName).toBe('INPUT');
  });

  it('honors data-autofocus', () => {
    render(<Harness autofocus />);
    fireEvent.click(opener());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('closes with the close button and returns focus to the opener', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    opener().focus();
    fireEvent.click(opener());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false));
    await waitFor(() => expect(document.activeElement).toBe(opener()));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape (native cancel then close) and returns focus', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    opener().focus();
    fireEvent.click(opener());
    const dialog = document.querySelector('dialog')!;
    // What the browser does on Escape: fire cancel, then close the dialog.
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    dialog.close();
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(document.activeElement).toBe(opener()));
  });

  it('has no axe violations when open', async () => {
    const { container } = render(<Harness />);
    fireEvent.click(opener());
    expect(await axeViolations(container)).toEqual([]);
  });
});
