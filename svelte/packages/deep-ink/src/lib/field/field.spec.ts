import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../../test/axe';
import Field from '../../../test/fixtures/FieldWithInput.svelte';

describe('Field', () => {
  it('links label, help and error to the control', () => {
    render(Field, { props: { label: 'Name', help: 'Used in the mock URL.', error: 'Enter a name.', required: true } });
    const input = screen.getByLabelText(/Name/);
    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.hasAttribute('required')).toBe(true);
    const ids = input.getAttribute('aria-describedby')!.split(' ');
    expect(ids).toHaveLength(2);
    const described = ids.map((id) => document.getElementById(id)?.textContent);
    expect(described[0]).toBe('Used in the mock URL.');
    expect(described[1]).toContain('Enter a name.');
  });

  it('states the error in words, not only with color', () => {
    render(Field, { props: { label: 'Name', error: 'Enter a name.' } });
    expect(screen.getByText('Error:').textContent).toBe('Error: ');
    expect(document.querySelector('.error svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('hides the required asterisk from assistive technology', () => {
    render(Field, { props: { label: 'Name', required: true } });
    expect(document.querySelector('.required')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('adds no description or invalid state when valid', () => {
    render(Field, { props: { label: 'Name' } });
    const input = screen.getByLabelText('Name');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('has no axe violations', async () => {
    const { container } = render(Field, { props: { label: 'Name', help: 'Help', error: 'Error text', required: true } });
    expect(await axeViolations(container)).toEqual([]);
  });

  it('gives each field its own ids, and focuses the control from its label', async () => {
    const user = userEvent.setup();
    render(Field, { props: { label: 'First', help: 'One' } });
    render(Field, { props: { label: 'Second', help: 'Two' } });
    const first = screen.getByRole('textbox', { name: 'First' });
    const second = screen.getByRole('textbox', { name: 'Second' });
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('textbox', { description: 'Two' })).toBe(second);
    await user.click(screen.getByText('Second'));
    expect(document.activeElement).toBe(second);
  });

  it('takes snippets for the label, help and error', () => {
    const html = (h: string) => createRawSnippet(() => ({ render: () => h }));
    render(Field, { props: { label: html('<span>Port</span>'), help: html('<span>1 to 65535</span>'), error: html('<span>Not a number</span>') } });
    const input = screen.getByRole('textbox', { name: 'Port' });
    expect(input.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent)).toEqual(['1 to 65535', 'Error: Not a number']);
  });
});
