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

  it('is skipped by Tab when disabled', async () => {
    const user = userEvent.setup();
    render(Select, { props: { 'aria-label': 'Protocol', disabled: true, children: options('REST') } });
    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });
});
