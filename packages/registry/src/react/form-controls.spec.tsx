// Input, Select, Checkbox, Radio, RadioGroup and Switch share one spec: they are small native wrappers.
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../test/axe';
import { Checkbox, RadioGroup } from './checkbox';
import { Field } from './field';
import { Input, Textarea } from './input';
import { Select } from './select';
import { Switch } from './switch';

describe('Input, Textarea and Select', () => {
  it('are native controls with the di classes and hooks', () => {
    render(
      <>
        <Input aria-label="Path" mono size="sm" />
        <Textarea aria-label="Notes" />
        <Select aria-label="Runner">
          <option>OpenAPI</option>
        </Select>
      </>,
    );
    const input = screen.getByLabelText('Path');
    expect(input.tagName).toBe('INPUT');
    expect(input.className).toBe('input');
    expect(input.getAttribute('data-mono')).toBe('');
    expect(input.getAttribute('data-size')).toBe('sm');
    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText('Runner').className).toContain('select');
  });

  it('works inside a Field for labels', () => {
    render(<Field label="Runner">{(c) => <Select {...c}><option>A</option></Select>}</Field>);
    expect(screen.getByLabelText('Runner').tagName).toBe('SELECT');
  });
});

describe('Checkbox', () => {
  it('has a visible label and a linked description', () => {
    render(<Checkbox label="Validate responses" description="Adds a schema check." />);
    const box = screen.getByRole('checkbox', { name: 'Validate responses' });
    expect(document.getElementById(box.getAttribute('aria-describedby')!)?.textContent).toBe('Adds a schema check.');
  });
});

describe('RadioGroup', () => {
  function Harness({ onPick }: { onPick: (v: string) => void }) {
    const [value, setValue] = useState<string | undefined>('mocks');
    return (
      <RadioGroup
        legend="Run against"
        value={value}
        onChange={(v) => {
          onPick(v);
          setValue(v);
        }}
        options={[
          { value: 'mocks', label: 'Mocks' },
          { value: 'impl', label: 'Implementations', description: 'Calls real services.' },
        ]}
        error="Pick a target."
      />
    );
  }

  it('is a fieldset with a legend and native radios', () => {
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);
    expect(screen.getByRole('group', { name: 'Run against' }).tagName).toBe('FIELDSET');
    expect((screen.getByRole('radio', { name: 'Mocks' }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Implementations' }));
    expect(onPick).toHaveBeenCalledWith('impl');
    expect((screen.getByRole('radio', { name: 'Implementations' }) as HTMLInputElement).checked).toBe(true);
  });

  it('links the group error and shares one name', () => {
    render(<Harness onPick={() => {}} />);
    const group = screen.getByRole('group', { name: 'Run against' });
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
    const names = new Set(screen.getAllByRole('radio').map((r) => r.getAttribute('name')));
    expect(names.size).toBe(1);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Harness onPick={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('renders card labels that keep the native radios', async () => {
    const { container } = render(
      <RadioGroup
        legend="Install mode"
        variant="card"
        value="sync"
        onChange={() => {}}
        options={[{ value: 'sync', label: 'Keep in sync', description: 'Re-import new versions.' }, { value: 'once', label: 'Import once' }]}
      />,
    );
    expect(container.querySelectorAll('label.choice[data-variant="card"]')).toHaveLength(2);
    expect((screen.getByRole('radio', { name: 'Keep in sync' }) as HTMLInputElement).checked).toBe(true);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Switch', () => {
  it('is a checkbox with role switch and reports the new state', () => {
    const onChange = vi.fn();
    render(<Switch label="Stateful mock" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Stateful mock' }) as HTMLInputElement;
    expect(sw.type).toBe('checkbox');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Switch label="Stateful mock" description="Keeps state between calls." checked onChange={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
