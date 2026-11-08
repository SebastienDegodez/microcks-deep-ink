import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '../../../test/axe';
import ConformanceMatrix from './ConformanceMatrix.svelte';
import { cellKey } from './model.js';
import type { MatrixColumn, MatrixGroup } from './types.js';
const columns: MatrixColumn[] = [{id:'jsonrpc',label:'JSON-RPC',sub:'preferred · SSE'},{id:'grpc',label:'gRPC',sub:'stream'}];
const groups: MatrixGroup[] = [
  {id:'card',label:'Agent Card',rows:[{id:'schema',label:'Schema',cells:[{result:'pass',duration:'42 ms'}]}]},
  {id:'behaviour',label:'Behaviour',sub:'2 replayed',rows:[
    {id:'eclair',label:'eclair-size-m',mono:true,cells:[{columnId:'jsonrpc',result:'pass',duration:'2.96 s'},{columnId:'grpc',result:'fail',duration:'2.84 s'}]},
    {id:'track',label:'ord-2417-ready',mono:true,cells:[{columnId:'jsonrpc',result:'running'},{columnId:'grpc',result:'queued'}]},
  ]},
];
describe('ConformanceMatrix', () => {
  it('has column, group, row headers, a spanning cell, and footer totals', () => {
    render(ConformanceMatrix,{caption:'Conformance matrix',columns,groups,footer:{label:'Conversations passed',cells:[{text:'1/2'},{text:'0/2',tone:'danger'}]}});
    const table=screen.getByRole('table',{name:'Conformance matrix'});
    expect(within(table).getAllByRole('columnheader').map(h=>h.textContent)).toEqual(['Check','JSON-RPCpreferred · SSE','gRPCstream']);
    expect(within(table).getAllByRole('rowheader').length).toBeGreaterThanOrEqual(4);
    expect(within(table).getByText('42 ms').closest('td')?.getAttribute('colspan')).toBe('2');
  });
  it('writes each result as a word', () => {
    render(ConformanceMatrix,{caption:'Matrix',columns,groups});
    for(const word of ['Passed','Failed','Running','Queued']) expect(screen.getAllByText(word).length).toBeGreaterThan(0);
  });
  it('toggles finished cells and keeps queued and running cells as text', async () => {
    const onselectcell=vi.fn();
    const {container}=render(ConformanceMatrix,{caption:'Matrix',columns,groups,selectedKey:cellKey('eclair','grpc'),onselectcell});
    const failed=screen.getByRole('button',{name:/gRPC × eclair-size-m: Failed\s*2\.84 s/});
    expect(failed.getAttribute('aria-pressed')).toBe('true');
    await fireEvent.click(failed);
    expect(onselectcell).toHaveBeenLastCalledWith(undefined);
    await fireEvent.click(screen.getByRole('button',{name:/JSON-RPC × eclair-size-m: Passed\s*2\.96 s/}));
    expect(onselectcell).toHaveBeenLastCalledWith('eclair|jsonrpc');
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(await axeViolations(container)).toEqual([]);
  });
  it('writes a custom result label and omits unfinished durations', () => {
    render(ConformanceMatrix,{caption:'Matrix',columns,groups:[{id:'g',label:'Card',rows:[{id:'sig',label:'Signature',cells:[{result:'warn',label:'Absent'},{columnId:'grpc',result:'running',duration:'4 s'}]}]}]});
    expect(screen.getByText('Absent')).toBeTruthy();
    expect(screen.queryByText('4 s')).toBeNull();
    expect(cellKey('sig')).toBe('sig|*');
  });
});
