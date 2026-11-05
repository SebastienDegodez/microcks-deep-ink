/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- the scrollable response body must be reachable by keyboard (WCAG 2.1.1) */
import './simulator.css';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Behavior, SimulationResult, StepKind } from '@/domain/catalog';
import { useAnnounce, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import type { IconName } from '@/ui/components/ui/icon';
import { Panel } from '@/ui/components/ui/panel';

const PRESETS = ['/pastries/Eclair%20Cafe', '/pastries/Millefeuille', '/pastries/Kouign-amann', '/pastries/Eclair%20Chocolat?size=XL'];
const API_KEY = { 'x-api-key': 'demo-7f3a' };
const STEP_ICON: Record<StepKind, IconName> = { ok: 'check', fail: 'cross', warn: 'warning', skip: 'minus-circle', info: 'info' };

type Kind = 'ok' | 'fail' | 'fwd';
interface HistoryItem { id: number; path: string; code: string; what: string; }

const kindOf = (r: SimulationResult): Kind => (r.status === null ? 'fwd' : r.status < 300 ? 'ok' : 'fail');
const STATUS_ICON: Record<Kind, IconName> = { ok: 'check', fail: 'cross', fwd: 'arrow-right' };

/** Short "what happened" of a run, shown in the Recent runs list. */
function what(r: SimulationResult): string {
  if (r.matched) return r.example.name;
  if (r.outcome === 'constraint') return 'constraint';
  if (r.outcome === 'forwarded') return 'proxied';
  if (r.outcome === 'no-operation') return 'no operation';
  return 'no match';
}

export interface SimulatorPanelProps {
  serviceId: string;
  operationId: string;
  method: string;
  protocol: string;
  /** Base URL of the mock, shown under the request field. */
  mockBase: string;
  /** The configuration being edited: the result follows every change. */
  draft: Behavior;
}

/**
 * Request simulator: a dry run of one call against the configuration on the page. The last request is
 * evaluated on load and again on every change of the configuration; Simulate also adds it to the recent runs.
 */
export function SimulatorPanel({ serviceId, operationId, method, protocol, mockBase, draft }: SimulatorPanelProps) {
  const uc = useUseCases();
  const announce = useAnnounce();
  const [input, setInput] = useState(PRESETS[0] as string);
  const [path, setPath] = useState(PRESETS[0] as string);
  const [sendKey, setSendKey] = useState(true);
  const [store, setStore] = useState<Record<string, number>>({});
  const [sim, setSim] = useState<SimulationResult | undefined>();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let live = true;
    void uc.catalog
      .simulate(serviceId, operationId, { path, params: {}, headers: sendKey ? API_KEY : undefined, store }, draft)
      .then((r) => { if (live) setSim(r); });
    return () => { live = false; };
  }, [uc, serviceId, operationId, path, sendKey, store, draft]);

  const run = async (target: string) => {
    setInput(target);
    setPath(target);
    const r = await uc.catalog.simulate(serviceId, operationId, { path: target, params: {}, headers: sendKey ? API_KEY : undefined, store }, draft);
    if (r.storeKey) setStore((s) => ({ ...s, [r.storeKey as string]: (s[r.storeKey as string] ?? 0) + 1 }));
    else setSim(r);
    setHistory((h) => [{ id: Date.now() + h.length, path: target, code: r.status === null ? 'fwd' : String(r.status), what: what(r) }, ...h].slice(0, 4));
    announce(`Simulation: ${r.statusLabel}.`);
  };

  const kind = sim ? kindOf(sim) : 'ok';
  return (
    <Panel
      className="sim"
      id="sec-sim"
      padding="lg"
      title={<><Icon name="play" size={16} className="sim-title-icon" />Request simulator</>}
    >
      <p className="panel-lead">Dry run against the configuration on this page, saved or not. Nothing reaches the live mock.</p>

      <form className="sim-form" onSubmit={(e) => { e.preventDefault(); void run(input); }}>
        <div className="sim-field">
          <label htmlFor="sim-path" className="section-label">Request</label>
          <div className="sim-request" style={{ '--sim-proto': `var(--proto-${protocol.toLowerCase()}, var(--proto-rest))` } as CSSProperties}>
            <span className="sim-method">{method}</span>
            <Input id="sim-path" className="sim-input" type="text" spellCheck={false} value={input} onChange={(e) => setInput(e.target.value)} aria-describedby="sim-base" />
          </div>
          <span id="sim-base" className="sim-base">{mockBase} + path</span>
        </div>

        <div className="sim-presets" role="group" aria-label="Request examples">
          {PRESETS.map((p) => <button key={p} type="button" className="sim-preset" onClick={() => void run(p)}>{p}</button>)}
        </div>

        <div className="sim-send">
          <Checkbox className="sim-key" label={<>Send header <code>x-api-key: demo-7f3a</code></>} checked={sendKey} onChange={(e) => setSendKey(e.target.checked)} />
          <Button type="submit" variant="primary" icon="play">Simulate</Button>
        </div>
      </form>

      {sim ? (
        <div className="sim-result" aria-label="Simulation result" role="group">
          <div className="sim-result-head">
            <span className="sim-line">{sim.requestLine}</span>
            <span className="sim-status" data-kind={kind}><Icon name={STATUS_ICON[kind]} size={12} />{sim.statusLabel}</span>
          </div>
          <div className="sim-chain">{sim.chain}</div>
          <ol className="sim-steps">
            {sim.steps.map((s, i) => (
              <li key={i} className="sim-step" data-kind={s.kind}>
                <span className="sim-step-icon"><Icon name={STEP_ICON[s.kind]} size={14} /></span>
                <span className="sim-step-text">
                  <span className="sim-step-label">{s.label}</span>
                  <span className="sim-step-value">{s.value}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="sim-response">
            <div className="sim-response-head"><span>Response</span><span className="sim-media">{sim.mediaType}</span></div>
            <pre className="sim-headers" aria-label="Response headers">{sim.headers.join('\n')}</pre>
            <pre className="sim-body" data-kind={kind} role="region" aria-label="Response body" tabIndex={0}>{sim.body}</pre>
          </div>
        </div>
      ) : null}

      {history.length ? (
        <div className="sim-history">
          <div className="section-label sim-history-head">
            <h3 className="sim-history-title">Recent runs</h3>
            <button type="button" className="sim-clear" onClick={() => setHistory([])}>Clear</button>
          </div>
          <ul className="sim-history-list">
            {history.map((h) => (
              <li key={h.id}>
                <button type="button" className="sim-run" onClick={() => void run(h.path)}>
                  <span className="sim-run-code" data-code={h.code === '200' ? 'ok' : h.code === 'fwd' ? 'fwd' : 'fail'}>{h.code}</span>
                  <span className="sim-run-path">{h.path}</span>
                  <span className="sim-run-what">{h.what}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  );
}
