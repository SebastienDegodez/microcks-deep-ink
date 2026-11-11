import type { SimulationResult, StepKind } from '../../domain/catalog/index.js';

type SimIcon = 'check' | 'cross' | 'warning' | 'minus-circle' | 'info' | 'arrow-right';
type ResultKind = 'ok' | 'fail' | 'fwd';

/** One-click requests of the simulator. */
export const REQUEST_PRESETS: readonly string[] = ['/pastries/Eclair%20Cafe', '/pastries/Millefeuille', '/pastries/Kouign-amann', '/pastries/Eclair%20Chocolat?size=XL'];

/** Header sent while "Send header x-api-key" is checked. */
export const API_KEY_HEADER = { 'x-api-key': 'demo-7f3a' };

/** Icon of a step of the simulation trace. */
export const STEP_ICON: Record<StepKind, SimIcon> = { ok: 'check', fail: 'cross', warn: 'warning', skip: 'minus-circle', info: 'info' };

/** Kind of a simulation result: `fwd` when forwarded to the real backend, `ok` under 300, else `fail`. */
export const resultKind = (r: SimulationResult): ResultKind => (r.status === null ? 'fwd' : r.status < 300 ? 'ok' : 'fail');

/** Icon of the result status, by kind. */
export const STATUS_ICON: Record<ResultKind, SimIcon> = { ok: 'check', fail: 'cross', fwd: 'arrow-right' };

/** A run of the Recent runs list. */
export interface HistoryItem { id: number; path: string; code: string; what: string; }

/** Short "what happened" of a run, shown in the Recent runs list. */
export function runSummary(r: SimulationResult): string {
  if (r.matched) return r.example.name;
  if (r.outcome === 'constraint') return 'constraint';
  if (r.outcome === 'forwarded') return 'proxied';
  if (r.outcome === 'no-operation') return 'no operation';
  return 'no match';
}

/** Code of a run in the Recent runs list: its HTTP status, or `fwd` when the call is forwarded. */
export const runCode = (r: SimulationResult) => (r.status === null ? 'fwd' : String(r.status));

/** Kind of a run code: `ok` for 200, `fwd` for a forwarded call, else `fail`. */
export const runCodeKind = (code: string): ResultKind => (code === '200' ? 'ok' : code === 'fwd' ? 'fwd' : 'fail');
