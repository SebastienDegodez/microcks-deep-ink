import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '../test/axe';
import { OpPickList, type OpPickOption } from './op-pick';

const OPS: OpPickOption[] = [
  { id: 'list', method: 'GET', path: '/pastries', summary: 'List pastries', meta: '3 examples', end: 812, endLabel: 'Calls over 7 days: ' },
  { id: 'get', method: 'GET', path: '/pastries/{name}', summary: 'Get a pastry', end: 96, endLabel: 'Calls over 7 days: ' },
  { id: 'patch', method: 'PATCH', path: '/pastries/{name}', summary: 'Update a pastry' },
];

function Radio() {
  const [v, setV] = useState('list');
  return <OpPickList mode="radio" label="Operation" options={OPS} value={v} onChange={setV} />;
}

describe('OpPickList', () => {
  it('toggle mode: buttons with aria-pressed, named by their text', async () => {
    let picked = '';
    const { container } = render(<OpPickList label="Operations" options={OPS} value="list" onChange={(id) => (picked = id)} />);
    expect(screen.getByRole('list', { name: 'Operations' })).toBeTruthy();
    const first = screen.getByRole('button', { name: /GET \/pastries List pastries 3 examples Calls over 7 days: 812/ });
    expect(first.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /PATCH/ }));
    expect(picked).toBe('patch');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('radio mode: one tab stop, arrows move and select with wrap', async () => {
    const { container } = render(<Radio />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    fireEvent.keyDown(radios[0]!, { key: 'ArrowUp' });
    expect(screen.getAllByRole('radio')[2]!.getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(screen.getAllByRole('radio')[2]);
    fireEvent.keyDown(screen.getAllByRole('radio')[2]!, { key: 'Home' });
    expect(screen.getAllByRole('radio')[0]!.getAttribute('aria-checked')).toBe('true');
    expect(await axeViolations(container)).toEqual([]);
  });
});
