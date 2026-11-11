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

  it('calls the native oninput on every keystroke, and onfocus and onblur', async () => {
    const user = userEvent.setup();
    const values: string[] = [];
    const oninput = vi.fn((e: Event) => values.push((e.currentTarget as HTMLInputElement).value));
    const onfocus = vi.fn();
    const onblur = vi.fn();
    render(Input, { props: { 'aria-label': 'Port', oninput, onfocus, onblur } });
    await user.tab();
    expect(onfocus).toHaveBeenCalledOnce();
    await user.keyboard('8080');
    expect(oninput).toHaveBeenCalledTimes(4);
    expect(values).toEqual(['8', '80', '808', '8080']);
    await user.tab();
    expect(onblur).toHaveBeenCalledOnce();
  });

  it('starts at defaultValue, and value wins over it', async () => {
    const user = userEvent.setup();
    render(Input, { props: { 'aria-label': 'Path', defaultValue: '/pastries' } });
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Path' });
    expect(input.value).toBe('/pastries');
    await user.type(input, '/x');
    expect(input.value).toBe('/pastries/x');
    render(Input, { props: { 'aria-label': 'Controlled', defaultValue: 'default', value: 'value' } });
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'Controlled' }).value).toBe('value');
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

  it('exposes its native element through bind:element, as Textarea does', () => {
    let input: HTMLInputElement | undefined;
    let textarea: HTMLTextAreaElement | undefined;
    render(Input, { props: { 'aria-label': 'Name', get element() { return input; }, set element(e) { input = e; } } });
    render(Textarea, { props: { 'aria-label': 'Hint', get element() { return textarea; }, set element(e) { textarea = e; } } });
    expect(input).toBe(screen.getByRole('textbox', { name: 'Name' }));
    expect(textarea).toBe(screen.getByRole('textbox', { name: 'Hint' }));
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

  it('starts at defaultValue and calls the native oninput on every keystroke', async () => {
    const user = userEvent.setup();
    const oninput = vi.fn();
    render(Textarea, { props: { 'aria-label': 'Notes', defaultValue: 'Hello', oninput } });
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Notes' });
    expect(textarea.value).toBe('Hello');
    await user.type(textarea, '!!');
    expect(textarea.value).toBe('Hello!!');
    expect(oninput).toHaveBeenCalledTimes(2);
  });

  it('keeps a text child equal to its value, also after an input event', async () => {
    const user = userEvent.setup();
    render(Textarea, { props: { 'aria-label': 'Hint', value: 'Tarte Tatin' } });
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Hint' });
    expect(textarea.textContent).toBe('Tarte Tatin');
    await user.type(textarea, '!');
    expect(textarea.value).toBe('Tarte Tatin!');
    expect(textarea.textContent).toBe('Tarte Tatin!');
  });
});
