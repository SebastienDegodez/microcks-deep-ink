import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Field } from './field';
import { Input } from './input';

describe('Field', () => {
  it('links label, help and error to the control', () => {
    render(
      <Field label="Name" help="Used in the mock URL." error="Enter a name." required>
        {(control) => <Input {...control} />}
      </Field>,
    );
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
    render(
      <Field label="Name" error="Enter a name.">
        {(control) => <Input {...control} />}
      </Field>,
    );
    expect(screen.getByText('Error:').textContent).toBe('Error: ');
    expect(document.querySelector('.error svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('hides the required asterisk from assistive technology', () => {
    render(
      <Field label="Name" required>
        {(control) => <Input {...control} />}
      </Field>,
    );
    expect(document.querySelector('.required')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('adds no description or invalid state when valid', () => {
    render(
      <Field label="Name">
        {(control) => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByLabelText('Name');
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Field label="Name" help="Help" error="Error text" required>
        {(control) => <Input {...control} />}
      </Field>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
