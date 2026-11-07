import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Harness from '../../../test/fixtures/DialogHarness.svelte';
import Dialog from './Dialog.svelte';

const opener = () => screen.getByRole('button', { name: 'Open dialog' });

describe('Dialog', () => {
  it('opens as a modal with a name and a description', async () => {
    render(Harness);
    await fireEvent.click(opener());
    const dialog = document.querySelector('dialog')!;
    expect(dialog.hasAttribute('open')).toBe(true);
    const title = screen.getByRole('heading', { name: 'Delete API Pastry?' });
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe('This cannot be undone.');
  });

  it('moves focus to the first control of the body', async () => {
    render(Harness);
    await fireEvent.click(opener());
    expect(document.activeElement?.tagName).toBe('INPUT');
  });

  it('honors data-autofocus', async () => {
    render(Harness, { props: { autofocus: true } });
    await fireEvent.click(opener());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('closes with the close button and returns focus to the opener', async () => {
    const onclose = vi.fn();
    render(Harness, { props: { onclose } });
    opener().focus();
    await fireEvent.click(opener());
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(document.querySelector('dialog')!.hasAttribute('open')).toBe(false));
    await waitFor(() => expect(document.activeElement).toBe(opener()));
    expect(onclose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape (native cancel then close) and returns focus', async () => {
    const onclose = vi.fn();
    render(Harness, { props: { onclose } });
    opener().focus();
    await fireEvent.click(opener());
    const dialog = document.querySelector('dialog')!;
    // What the browser does on Escape: fire cancel, then close the dialog.
    await fireEvent(dialog, new Event('cancel', { cancelable: true }));
    dialog.close();
    await waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(document.activeElement).toBe(opener()));
  });

  it('has no axe violations when open', async () => {
    const { container } = render(Harness);
    await fireEvent.click(opener());
    expect(await axeViolations(container)).toEqual([]);
  });

  it('closes on a backdrop click only with closeOnBackdrop', async () => {
    const onclose = vi.fn();
    const { rerender } = render(Dialog, { props: { open: true, onclose, title: 'T', children: createRawSnippet(() => ({ render: () => '<p>Body</p>' })) } });
    const dialog = document.querySelector('dialog')!;
    await fireEvent.click(dialog);
    expect(onclose).not.toHaveBeenCalled();
    await rerender({ closeOnBackdrop: true });
    await fireEvent.click(screen.getByText('Body'));
    expect(onclose).not.toHaveBeenCalled();
    await fireEvent.click(dialog);
    expect(onclose).toHaveBeenCalledOnce();
  });
});
