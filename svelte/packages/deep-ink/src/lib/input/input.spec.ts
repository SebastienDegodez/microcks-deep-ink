import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Input from './Input.svelte';
import Textarea from './Textarea.svelte';

describe('Input', () => {
  it('is a text field named by its label, reached with Tab', async () => {
    const user = userEvent.setup();
    const { container } = render(Input, { props: { 'aria-label': 'Search services', placeholder: 'API Pastry' } });
    const input = screen.getByRole('textbox', { name: 'Search services' });
    expect(input.getAttribute('type')).toBe('text');
    await user.tab();
    expect(document.activeElement).toBe(input);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('binds the typed value and calls the native input handler', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    let value = '/pastries';
    render(Input, { props: { 'aria-label': 'Operation path', mono: true, oninput, get value() { return value; }, set value(v) { value = v as string; } } });
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Operation path' });
    expect(input.value).toBe('/pastries');
    await user.type(input, '/{{name}', { initialSelectionStart: 9 });
    expect(input.value).toBe('/pastries/{name}');
    expect(value).toBe('/pastries/{name}');
    expect(oninput).toHaveBeenCalledTimes(7);
  });

  it('keeps the native type and attributes', () => {
    render(Input, { props: { type: 'email', 'aria-label': 'Email', required: true } });
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input.getAttribute('type')).toBe('email');
    expect(input.hasAttribute('required')).toBe(true);
  });

  it('describes an invalid value with its error message', async () => {
    const { container } = render(Input, { props: { id: 'port', 'aria-label': 'Port', 'aria-invalid': 'true', 'aria-describedby': 'port-error', value: '80a' } });
    container.insertAdjacentHTML('beforeend', '<p id="port-error">The port must be a number.</p>');
    const input = screen.getByRole('textbox', { name: 'Port' });
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('port-error');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('is skipped by Tab when disabled', async () => {
    const user = userEvent.setup();
    render(Input, { props: { 'aria-label': 'Dispatcher', disabled: true, value: 'URI_PARTS' } });
    await user.tab();
    expect(document.activeElement).toBe(document.body);
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Dispatcher' }).disabled).toBe(true);
  });
});

describe('Textarea', () => {
  it('is a multiline text field that binds the typed value', async () => {
    const user = userEvent.setup();
    let value = '';
    const { container } = render(Textarea, { props: { 'aria-label': 'Payload', rows: 4, get value() { return value; }, set value(v) { value = v as string; } } });
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Payload' });
    expect(textarea.localName).toBe('textarea');
    await user.tab();
    expect(document.activeElement).toBe(textarea);
    await user.keyboard('{{{Enter}}');
    expect(value).toBe('{\n}');
    expect(await axeViolations(container)).toEqual([]);
  });
});
