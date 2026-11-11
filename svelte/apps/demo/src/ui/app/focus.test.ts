import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import AutoFocusPanel from './test-fixtures/AutoFocusPanel.svelte';
import DeleteList from './test-fixtures/DeleteList.svelte';
import Fallbacks from './test-fixtures/Fallbacks.svelte';
import FinishRun from './test-fixtures/FinishRun.svelte';
import InlineForm from './test-fixtures/InlineForm.svelte';

async function click(element: HTMLElement) {
  await fireEvent.click(element);
  await tick();
}

describe('useReturnFocus', () => {
  it('moves focus to the Undo button that replaces a deleted row', async () => {
    render(DeleteList);
    const del = screen.getByRole('button', { name: 'Delete a' });
    del.focus();
    await click(del);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Undo' }));
  });

  it('returns focus to the opener when an inline form closes', async () => {
    render(InlineForm);
    await click(screen.getByRole('button', { name: 'Add header' }));
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    cancel.focus();
    await click(cancel);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add header' }));
  });

  it('falls back to the closest region that held the focused control', async () => {
    render(Fallbacks, { props: { withRegion: true } });
    const button = screen.getByRole('button', { name: 'Dismiss' });
    button.focus();
    await click(button);
    const region = screen.getByRole('region', { name: 'Panel' });
    expect(document.activeElement).toBe(region);
    expect(region.getAttribute('tabindex')).toBe('-1');
  });

  it('falls back to the page h1 when no region is left', async () => {
    render(Fallbacks, { props: { withRegion: false } });
    const button = screen.getByRole('button', { name: 'Dismiss' });
    button.focus();
    await click(button);
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
  });

  it('accepts a function target', async () => {
    render(FinishRun);
    await click(screen.getByRole('button', { name: 'Finish' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Verdict' }));
  });
});

describe('useAutoFocus', () => {
  it('focuses [data-autofocus] inside the form when it opens', async () => {
    render(InlineForm);
    await click(screen.getByRole('button', { name: 'Add header' }));
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Value' }));
  });

  it('focuses the first field when nothing is marked', async () => {
    render(AutoFocusPanel, { props: { open: true } });
    await tick();
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'First' }));
  });

  it('does nothing while closed', async () => {
    render(AutoFocusPanel, { props: { open: false } });
    await tick();
    expect(document.activeElement).toBe(document.body);
  });
});
