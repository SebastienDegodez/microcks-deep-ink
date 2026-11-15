import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Select from './Select.svelte';

const options = (...values: string[]) =>
  createRawSnippet(() => ({ render: () => `<optgroup label="Dispatchers">${values.map((v) => `<option value="${v}">${v}</option>`).join('')}</optgroup>` }));

describe('Select', () => {
  it('is a native combobox named by its label, reached with Tab', async () => {
    const user = userEvent.setup();
    const { container } = render(Select, { props: { 'aria-label': 'Dispatcher', children: options('URI_PARTS', 'JSON_BODY') } });
    const select = screen.getByRole('combobox', { name: 'Dispatcher' });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['URI_PARTS', 'JSON_BODY']);
    await user.tab();
    expect(document.activeElement).toBe(select);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('binds the selected value and calls the native change handler', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    let value = 'JSON_BODY';
    render(Select, { props: { 'aria-label': 'Dispatcher', onchange, children: options('URI_PARTS', 'JSON_BODY', 'SCRIPT'), get value() { return value; }, set value(v) { value = v as string; } } });
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Dispatcher' });
    expect(select.value).toBe('JSON_BODY');
    await user.selectOptions(select, 'SCRIPT');
    expect(value).toBe('SCRIPT');
    expect(screen.getByRole<HTMLOptionElement>('option', { name: 'SCRIPT' }).selected).toBe(true);
    expect(onchange).toHaveBeenCalledOnce();
  });

  it('calls the React onchange, onfocus and onblur, and starts at defaultValue', async () => {
    const user = userEvent.setup();
    const onchange = vi.fn();
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Select, { props: { 'aria-label': 'Dispatcher', defaultValue: 'JSON_BODY', onchange, onfocus, onblur, children: options('URI_PARTS', 'JSON_BODY', 'SCRIPT') } });
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Dispatcher' });
    expect(select.value).toBe('JSON_BODY');
    await user.tab();
    expect(onfocus).toHaveBeenCalledOnce();
    await user.selectOptions(select, 'SCRIPT');
    expect(onchange).toHaveBeenCalledOnce();
    expect(select.value).toBe('SCRIPT');
    await user.tab();
    expect(onblur).toHaveBeenCalledOnce();
  });

  it('is skipped by Tab when disabled', async () => {
    const user = userEvent.setup();
    render(Select, { props: { 'aria-label': 'Protocol', disabled: true, children: options('REST') } });
    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it('shows the first enabled option when the value matches none, and keeps the bound value', () => {
    let value = 'SCRIPT';
    render(Select, { props: { 'aria-label': 'Dispatcher', children: options('URI_PARTS', 'JSON_BODY'), get value() { return value; }, set value(v) { value = v as string; } } });
    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Dispatcher' }).value).toBe('URI_PARTS');
    expect(screen.getByRole<HTMLOptionElement>('option', { name: 'URI_PARTS' }).selected).toBe(true);
    expect(value).toBe('SCRIPT');
  });

  it('keeps showing the first enabled option when options are added later', async () => {
    render(Select, { props: { 'aria-label': 'Dispatcher', value: 'SCRIPT', children: options('URI_PARTS') } });
    const select = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Dispatcher' });
    select.querySelector('optgroup')?.prepend(new Option('JSON_BODY', 'JSON_BODY'));
    await new Promise((resolve) => setTimeout(resolve));
    expect(select.value).toBe('JSON_BODY');
  });

  it('skips a disabled first option when the value matches none', () => {
    const placeholder = createRawSnippet(() => ({ render: () => '<optgroup label="Dispatchers"><option value="" disabled>Choose</option><option value="URI_PARTS">URI_PARTS</option></optgroup>' }));
    render(Select, { props: { 'aria-label': 'Dispatcher', value: 'SCRIPT', children: placeholder } });
    expect(screen.getByRole<HTMLSelectElement>('combobox', { name: 'Dispatcher' }).value).toBe('URI_PARTS');
  });
});
