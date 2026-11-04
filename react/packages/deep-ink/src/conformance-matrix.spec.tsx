// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { axeViolations } from '../test/axe';
import { cellKey, ConformanceMatrix, type MatrixColumn, type MatrixGroup } from './conformance-matrix';

afterEach(cleanup);

const COLUMNS: MatrixColumn[] = [
  { id: 'jsonrpc', label: 'JSON-RPC', sub: 'preferred · SSE' },
  { id: 'grpc', label: 'gRPC', sub: 'stream' },
];
const GROUPS: MatrixGroup[] = [
  { id: 'card', label: 'Agent Card', rows: [{ id: 'schema', label: 'Schema', cells: [{ result: 'pass', duration: '42 ms' }] }] },
  {
    id: 'behaviour',
    label: 'Behaviour',
    sub: '2 replayed',
    rows: [
      { id: 'eclair', label: 'eclair-size-m', mono: true, cells: [{ columnId: 'jsonrpc', result: 'pass', duration: '2.96 s' }, { columnId: 'grpc', result: 'fail', duration: '2.84 s' }] },
      { id: 'track', label: 'ord-2417-ready', mono: true, cells: [{ columnId: 'jsonrpc', result: 'running' }, { columnId: 'grpc', result: 'queued' }] },
    ],
  },
];

describe('ConformanceMatrix', () => {
  it('is a table with column, group and row headers, and a cell that spans every column', () => {
    render(<ConformanceMatrix caption="Conformance matrix" columns={COLUMNS} groups={GROUPS} footer={{ label: 'Conversations passed', cells: [{ text: '1/2' }, { text: '0/2', tone: 'danger' }] }} />);
    const table = screen.getByRole('table', { name: 'Conformance matrix' });
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Check', 'JSON-RPCpreferred · SSE', 'gRPCstream']);
    expect(within(table).getAllByRole('rowheader').length).toBeGreaterThanOrEqual(4);
    const spanning = within(table).getByText('42 ms').closest('td')!;
    expect(spanning.getAttribute('colspan')).toBe('2');
  });

  it('writes every result as a word', () => {
    render(<ConformanceMatrix caption="Matrix" columns={COLUMNS} groups={GROUPS} />);
    for (const word of ['Passed', 'Failed', 'Running', 'Queued']) expect(screen.getAllByText(word).length).toBeGreaterThan(0);
  });

  it('turns finished cells into pressed buttons and leaves queued and running cells as text', () => {
    const onSelectCell = vi.fn();
    render(<ConformanceMatrix caption="Matrix" columns={COLUMNS} groups={GROUPS} selectedKey={cellKey('eclair', 'grpc')} onSelectCell={onSelectCell} />);
    const failed = screen.getByRole('button', { name: /gRPC × eclair-size-m: Failed\s*2\.84 s/ });
    expect(failed.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(failed);
    expect(onSelectCell).toHaveBeenLastCalledWith(undefined);
    fireEvent.click(screen.getByRole('button', { name: /JSON-RPC × eclair-size-m: Passed\s*2\.96 s/ }));
    expect(onSelectCell).toHaveBeenLastCalledWith('eclair|jsonrpc');
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('has no axe violations', async () => {
    const { container } = render(<ConformanceMatrix caption="Matrix" columns={COLUMNS} groups={GROUPS} onSelectCell={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });

  it('writes a custom word on a cell', () => {
    render(<ConformanceMatrix caption="Matrix" columns={COLUMNS} groups={[{ id: 'g', label: 'Card', rows: [{ id: 'sig', label: 'Signature', cells: [{ result: 'warn', label: 'Absent' }] }] }]} />);
    expect(screen.getByText('Absent')).toBeTruthy();
  });
});
