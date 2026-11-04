import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { icon } from '../../utils/icons';
import { LoomEdge, LoomGrid, LoomLayout, LoomPlacement, layoutLoom, loomGrid, operationParts } from '../../utils/loom-layout';
import {
  CheckState,
  LoomAction,
  LoomInput,
  LoomOutput,
  LoomSource,
  LoomStep,
  LoomThread,
  PROTOCOL_TOKEN,
  StepStatus,
  parseJson,
} from '../../utils/types';

let uid = 0;

const STATUS_WORD: Record<StepStatus, string> = { passed: 'Passed', failed: 'Failed', 'not-run': 'Not run' };
const STATUS_ICON: Record<StepStatus, string> = { passed: 'check', failed: 'cross', 'not-run': 'dash' };
const CHECK_WORD: Record<CheckState, string> = {
  passed: 'Passed',
  failed: 'Failed',
  off: 'Off',
  'not-evaluated': 'Not evaluated',
};
const CHECK_ICON: Record<CheckState, string> = { passed: 'check', failed: 'cross', off: 'dash', 'not-evaluated': 'circle' };

/* Circled marks of the node (decorative: the words next to them carry the meaning). */
const RING = 'M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0';
const MARK = { pass: 'M8 12.5l2.5 2.5L16 9.5', fail: 'M9 9l6 6M15 9l-6 6', skip: 'M8 12h8' };
const STATUS_MARK: Record<StepStatus, string> = { passed: MARK.pass, failed: MARK.fail, 'not-run': MARK.skip };
const CHECK_MARK: Record<CheckState, string> = { passed: MARK.pass, failed: MARK.fail, off: MARK.skip, 'not-evaluated': MARK.skip };

const ringed = (mark: string, size: number) => (
  <svg class="ring" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path d={RING} />
    <path d={mark} />
  </svg>
);


const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const seconds = (n: number) => `${Number.isInteger(n) ? n : Number(n.toFixed(2))} s`;

/**
 * Arazzo workflow as a loom: one lane per sourceDescription (warp), steps as nodes,
 * data threads between steps (weft). Step-level dependsOn draws parallel branches that join.
 * Supported actions: `end` (exit branch) and `retry` (loop). There is no goto.
 * Keyboard: arrow keys move between nodes, Home/End jump to the first/last, Enter/Space select.
 * A built-in "Show as table" toggle switches to an equivalent Steps table.
 */
@Component({
  tag: 'workflow-loom',
  shadow: true,
  styles: `
    :host { display: block; color: var(--text); font: var(--type-body); }
    *, *::before, *::after { box-sizing: border-box; }
    .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-bottom: 12px; }
    .toggle { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 4px 12px; font: 600 13px/18px var(--font-ui); color: var(--text); background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--radius-control); cursor: pointer; }
    .toggle[aria-pressed="true"] { background: var(--selected); border-color: var(--action); }
    button:focus-visible, .scroll:focus-visible { outline: 2px solid var(--action); outline-offset: 2px; box-shadow: var(--shadow-focus); }
    .scroll { overflow-x: auto; padding: 4px 0 4px; border-radius: var(--radius-panel); }
    .stage { position: relative; display: grid; align-items: center; }
    svg.edges { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
    path.ah { stroke: var(--border-control); }
    path.edge { fill: none; stroke: var(--border-control); stroke-width: 1.5; }
    .lane-head { grid-column: 2 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 2px 0; font: 400 12px/16px var(--font-ui); color: var(--text-muted); }
    .badge { display: inline-flex; overflow: hidden; font: 400 11px/16px var(--font-mono); border: 1px solid var(--border); border-radius: 6px; }
    .badge > span { padding: 2px 7px; }
    .bp { background: var(--lane); color: var(--on-proto); font-weight: 600; }
    .bn { background: var(--surface); color: var(--text); }
    .lt { font-family: var(--font-mono); }
    .lane-head .warn { display: inline-flex; align-items: center; gap: 4px; color: var(--warning); font-weight: 600; }
    .acts { grid-column: 1 / -1; position: relative; height: 54px; font: 400 11px/14px var(--font-mono); color: var(--text-secondary); }
    .acts > * { position: absolute; white-space: nowrap; }
    .end-label { top: 0; }
    .note { color: var(--text-muted); }
    .end-v { top: 27px; height: 27px; border-left: 1.5px dashed var(--text-secondary); }
    .end-h { top: 27px; border-top: 1.5px dashed var(--text-secondary); }
    .end-v.on, .end-h.on { border-style: solid; border-color: var(--success); }
    .end-pill { top: 18px; display: inline-flex; align-items: center; gap: 5px; padding: 1px 8px; color: var(--text-secondary); background: var(--canvas); border: 1px solid currentColor; border-radius: 999px; }
    .end-pill.on { color: var(--success); }
    svg.loop { top: 20px; stroke: var(--text-secondary); }
    svg.loop.bad { stroke: var(--danger); }
    .retry-label { top: 20px; }
    .retry-label .bad { color: var(--danger); font-weight: 600; }
    .warp { grid-column: 2 / -2; position: relative; align-self: stretch; }
    .warp::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px; background: var(--lane); }
    .warp::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 8px; margin-top: -4px; background: radial-gradient(circle 4px at 4px 50%, var(--lane) 99%, transparent), radial-gradient(circle 4px at calc(100% - 4px) 50%, var(--lane) 99%, transparent); }
    .io { grid-column: 1; position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; padding: 0 2px; }
    .io.out { grid-column: -2; align-items: flex-end; }
    .io-h { font: 400 12px/16px var(--font-ui); color: var(--text-muted); }
    .io-chip { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; max-width: 100%; padding: 4px 6px; font: 400 11px/14px var(--font-mono); text-align: left; color: var(--text); background: var(--canvas); border: 1px solid var(--border); border-radius: 6px; }
    .io-x { font-weight: 600; overflow-wrap: anywhere; }
    .io-v { color: var(--text-secondary); overflow-wrap: anywhere; }
    .io-v.none { color: var(--text-muted); }
    .io-note { max-width: 100%; font: 400 11px/1.4 var(--font-ui); color: var(--text-muted); text-align: right; }
    .io-line { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font: var(--type-small); color: var(--text-secondary); }
    .io-line code { font: 400 12px/16px var(--font-mono); color: var(--text); background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--radius-control); padding: 2px 6px; }
    .cell { position: relative; z-index: 1; display: flex; justify-content: center; min-width: 0; padding: 0 12px; }
    .node { position: relative; width: 100%; max-width: 190px; display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 8px; text-align: left; color: var(--text); background: var(--surface); border: 1px solid var(--border-strong); border-radius: 12px; cursor: pointer; font: inherit; }
    .node[data-status="failed"] { border-color: var(--danger); }
    .node[data-status="not-run"] { background: var(--canvas); border-style: dashed; }
    .node[aria-pressed="true"] { padding: 7px; background: var(--selected); border: 2px solid var(--action); }
    .hd { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .num { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 999px; background: var(--raised); color: var(--text); font: 600 11px/1 var(--font-ui); }
    .node[data-status="failed"] .num { background: var(--danger); color: var(--on-status); }
    .id { min-width: 0; font: 600 12px/16px var(--font-mono); overflow-wrap: anywhere; }
    .op { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; font: 400 11px/16px var(--font-mono); }
    .mt { --method-bg: var(--lane, var(--proto-rest)); flex: none; padding: 1px 4px; font: 600 10px/14px var(--font-mono); color: var(--on-proto); background: var(--method-bg); border-radius: 3px; }
    .mt[data-protocol="rest"][data-method="POST" i], .mt[data-protocol="rest"][data-method="PATCH" i], .mt[data-protocol="rest"][data-method="PUT" i] { --method-bg: var(--proto-event); }
    .mt[data-protocol="rest"][data-method="DELETE" i] { --method-bg: var(--danger); color: var(--on-status); }
    .pa { color: var(--text-secondary); overflow-wrap: anywhere; }
    .rule { height: 1px; background: var(--border); }
    .ring { flex: none; }
    .st { display: inline-flex; align-items: center; gap: 5px; font: 600 12px/16px var(--font-ui); }
    .st.passed { color: var(--success); }
    .st.failed { color: var(--danger); }
    .st.not-run { color: var(--text-muted); }
    .checks { display: flex; flex-direction: column; gap: 3px; font: 400 11px/14px var(--font-ui); }
    .chk { display: inline-flex; align-items: center; gap: 5px; color: var(--text-secondary); }
    .chk.passed .ring { color: var(--success); }
    .chk.failed, .chk.failed .ring { color: var(--danger); }
    .chk.off, .chk.not-evaluated { color: var(--text-muted); }
    .res { font: 400 10px/14px var(--font-mono); font-variant-numeric: tabular-nums; color: var(--text-muted); }
    .c.passed { color: var(--success); }
    .c.failed { color: var(--danger); }
    .c.off, .c.not-evaluated { color: var(--text-muted); }
    .threads { grid-column: 1 / -1; }
    .threads { list-style: none; margin: 0; padding: 0; }
    .thread-li { font: 400 11px/16px var(--font-mono); color: var(--link); }
    .thread-li.dim { color: var(--text-muted); }
    .table-wrap { overflow: auto; border: 1px solid var(--border); border-radius: var(--radius-panel); }
    .table-wrap:focus-visible { outline: 2px solid var(--action); outline-offset: 2px; }
    table { width: 100%; border-collapse: collapse; font: var(--type-small); }
    caption { text-align: left; padding: 8px 12px; font: 600 13px/18px var(--font-ui); color: var(--text-secondary); }
    th, td { padding: 8px 12px; text-align: left; vertical-align: top; border-top: 1px solid var(--border); }
    thead th { font: 600 12px/16px var(--font-ui); letter-spacing: .04em; text-transform: uppercase; color: var(--text-secondary); background: var(--surface); }
    td.mono, th[scope="row"] { font-family: var(--font-mono); }
    td ul { margin: 0; padding: 0; list-style: none; }
    .cellbtn { font: 600 13px/18px var(--font-mono); color: var(--link); background: none; border: 0; padding: 2px 0; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
    .cellbtn[aria-pressed="true"] { color: var(--text); text-decoration-thickness: 2px; }
    .t-threads { margin-top: 12px; }
    .t-threads .th { margin: 0 0 4px; font: 600 13px/18px var(--font-ui); color: var(--text-secondary); }
    .sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
    .thread-li { padding: 2px 0; }
  `,
})
export class MkWorkflowLoom {
  private readonly uid = ++uid;
  private nodeEls = new Map<string, HTMLButtonElement>();

  @Prop() sources: LoomSource[] | string = [];
  @Prop() steps: LoomStep[] | string = [];
  @Prop() threads: LoomThread[] | string = [];
  /** Workflow inputs, drawn in the inputs column: names, or `{ name, expression?, value? }`. */
  @Prop() inputs: (string | LoomInput)[] | string = [];
  /** Workflow outputs, drawn in the outputs column: names, or `{ name, value? }`. */
  @Prop() outputs: (string | LoomOutput)[] | string = [];
  /** Short note under the outputs ("No outputs: #14 failed."). */
  @Prop() outputNote?: string;
  /** When the run validates schemas, every step shows its two checks. */
  @Prop() validatesSchemas = false;
  /** Selected step id (mutable: clicking a step selects it). */
  @Prop({ mutable: true }) selectedStep?: string;
  /** Accessible name of the group. */
  @Prop() label = 'Arazzo workflow';

  @State() hot?: string;
  @State() focusId?: string;
  @State() asTable = false;
  /** Measured paths of the dependsOn edges (parallel branches only). */
  @State() edgePaths: string[] = [];

  private stageEl?: HTMLDivElement;
  private resizer?: ResizeObserver;
  private edgeKey = '';
  private parallelEdges: LoomEdge[] = [];

  /** Emitted when a step is selected (click, Enter or Space). */
  @Event() mkStepSelect!: EventEmitter<{ stepId: string }>;

  private select(stepId: string) {
    this.selectedStep = stepId;
    this.mkStepSelect.emit({ stepId });
  }

  /* ---------- text helpers (shared by graph and table) ---------- */

  private statusPhrase(s: LoomStep): string | undefined {
    if (!s.status) return undefined;
    const word = STATUS_WORD[s.status];
    const n = s.attempts ?? 0;
    return n > 1 || (s.status === 'failed' && n > 0) ? `${word} after ${plural(n, 'attempt')}` : word;
  }

  private statusVisible(s: LoomStep): string | undefined {
    if (!s.status) return undefined;
    return this.statusPhrase(s);
  }

  private checkStates(s: LoomStep): { successCriteria: CheckState; schemaValidation: CheckState } {
    return {
      successCriteria: s.checks?.successCriteria ?? 'not-evaluated',
      schemaValidation: s.checks?.schemaValidation ?? 'not-evaluated',
    };
  }

  private accessibleName(s: LoomStep, p: LoomPlacement): string {
    const { method, path } = operationParts(s);
    const parts = [`Step ${p.number}`, s.stepId, [method, path].filter(Boolean).join(' ')];
    const status = this.statusPhrase(s);
    if (status) parts.push(status);
    if (this.validatesSchemas) {
      const c = this.checkStates(s);
      parts.push(`Success criteria ${CHECK_WORD[c.successCriteria].toLowerCase()}`);
      parts.push(`Schema validation ${CHECK_WORD[c.schemaValidation].toLowerCase()}`);
    }
    if (s.result) parts.push(s.result);
    return parts.join(', ');
  }

  private actionText(a: LoomAction, s: LoomStep): string {
    if (a.type === 'end') {
      const state = a.taken === true ? ', taken' : a.taken === false ? ', not taken' : '';
      return `On ${a.on}, end if ${a.criteria}${state}`;
    }
    const applied = a.applied ? `, applied${s.attempts ? ` (${plural(s.attempts, 'attempt')})` : ''}` : '';
    return `On failure, retry every ${seconds(a.retryAfter)}, up to ${plural(a.retryLimit, 'time')}${applied}`;
  }

  private description(s: LoomStep, source?: LoomSource): string {
    const bits: string[] = [];
    if (source?.type === 'asyncapi') bits.push('AsyncAPI step, shown but not runnable');
    if (source && !source.linked) bits.push(`Source ${source.name} is not linked`);
    for (const a of s.actions ?? []) bits.push(this.actionText(a, s));
    return bits.join('. ');
  }

  /* ---------- keyboard navigation ---------- */

  private neighbour(layout: LoomLayout, from: LoomPlacement, key: string): string | undefined {
    const offsets: number[] = [];
    layout.laneRows.reduce((acc, rows, i) => ((offsets[i] = acc), acc + rows), 0);
    const v = (p: LoomPlacement) => (offsets[p.lane] ?? 0) + p.row;
    const all = layout.placements;
    const sorted = [...all].sort((a, b) => a.column - b.column || v(a) - v(b));
    const here = v(from);
    if (key === 'Home') return sorted[0]?.stepId;
    if (key === 'End') return sorted[sorted.length - 1]?.stepId;
    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      const dir = key === 'ArrowRight' ? 1 : -1;
      const cols = all.map((p) => p.column).filter((c) => (c - from.column) * dir > 0);
      if (!cols.length) return undefined;
      const target = dir > 0 ? Math.min(...cols) : Math.max(...cols);
      const cand = all.filter((p) => p.column === target);
      cand.sort((a, b) => Math.abs(v(a) - here) - Math.abs(v(b) - here) || v(a) - v(b));
      return cand[0]?.stepId;
    }
    const same = all.filter((p) => p.column === from.column);
    if (key === 'ArrowDown') {
      const next = same.filter((p) => v(p) > here).sort((a, b) => v(a) - v(b));
      return next[0]?.stepId;
    }
    if (key === 'ArrowUp') {
      const prev = same.filter((p) => v(p) < here).sort((a, b) => v(b) - v(a));
      return prev[0]?.stepId;
    }
    return undefined;
  }

  private onNodeKey(e: KeyboardEvent, layout: LoomLayout, p: LoomPlacement) {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    const target = this.neighbour(layout, p, e.key);
    if (target && target !== p.stepId) {
      this.focusId = target;
      this.nodeEls.get(target)?.focus();
    }
  }

  /* ---------- rendering ---------- */

  private threadItems(threads: LoomThread[], isDim: (t: LoomThread) => boolean, left?: (t: LoomThread) => number, top?: (i: number) => number) {
    return threads.map((t, i) => (
      <li
        class={{ 'thread-li': true, dim: isDim(t) }}
        style={left && top ? { left: `${left(t)}px`, top: `${top(i)}px` } : undefined}
      >
        <span class="sr">{`${t.from} to ${t.to}: `}</span>
        {t.expression}
        <span class="thread-to" aria-hidden="true">{` → ${t.to}`}</span>
      </li>
    ));
  }

  private renderNode(s: LoomStep, pl: LoomPlacement, layout: LoomLayout, tabStop: string | undefined, descId: string | undefined, protocol: string) {
    const c = this.checkStates(s);
    const { method, path } = operationParts(s);
    const cut = path.indexOf('/{');
    const pathA = cut > 0 ? path.slice(0, cut) : path;
    const pathB = cut > 0 ? path.slice(cut) : '';
    const checks = this.validatesSchemas ? (['successCriteria', 'schemaValidation'] as const) : [];
    const lower = s.status || checks.length > 0 || s.result;
    return (
      <button
        type="button"
        class="node"
        data-status={s.status}
        aria-pressed={this.selectedStep === s.stepId ? 'true' : 'false'}
        aria-label={this.accessibleName(s, pl)}
        aria-describedby={descId}
        tabindex={s.stepId === tabStop ? 0 : -1}
        ref={(el) => (el ? this.nodeEls.set(s.stepId, el) : this.nodeEls.delete(s.stepId))}
        onClick={() => this.select(s.stepId)}
        onKeyDown={(e) => this.onNodeKey(e, layout, pl)}
        onMouseEnter={() => (this.hot = s.stepId)}
        onMouseLeave={() => (this.hot = undefined)}
        onFocus={() => {
          this.hot = s.stepId;
          this.focusId = s.stepId;
        }}
        onBlur={() => (this.hot = undefined)}
      >
        <span class="hd">
          <span class="num">{pl.number}</span> <span class="id">{s.stepId}</span>
        </span>{' '}
        <span class="op">
          {method && (
            <span class="mt" data-method={method} data-protocol={protocol.toLowerCase()}>
              {method}
            </span>
          )}{' '}
          <span class="pa">{pathA}</span>
          {pathB && <span class="pa">{pathB}</span>}
        </span>{' '}
        {lower && <span class="rule" aria-hidden="true" />}
        {s.status && (
          <span class={`st ${s.status}`}>
            {ringed(STATUS_MARK[s.status], 13)}
            {this.statusVisible(s)}
          </span>
        )}{' '}
        {checks.length > 0 && (
          <span class="checks">
            {checks.map((k) => [
              <span class={`chk ${c[k]}`}>
                {ringed(CHECK_MARK[c[k]], 12)}
                {k === 'successCriteria' ? 'Success criteria' : 'Schema validation'}
              </span>,
              ' ',
            ])}
          </span>
        )}
        {s.result && <span class="res">{s.result}</span>}
      </button>
    );
  }

  private renderTable(layout: LoomLayout, steps: LoomStep[], sources: LoomSource[], threads: LoomThread[]) {
    const src = (name: string) => sources.find((s) => s.name === name);
    const none = (
      <span>
        <span aria-hidden="true">—</span>
        <span class="sr">None</span>
      </span>
    );
    return [
      <div class="table-wrap" role="region" aria-label={`${this.label}, steps table`} tabindex={0}>
        <table>
          <caption>{`${this.label}: ${plural(steps.length, 'step')}`}</caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Step</th>
              <th scope="col">Source</th>
              <th scope="col">Operation</th>
              <th scope="col">Depends on</th>
              <th scope="col">Status</th>
              <th scope="col">Checks</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((s, i) => {
              const p = layout.placements[i]!;
              const source = src(s.source);
              const status = this.statusVisible(s);
              const c = this.checkStates(s);
              return (
                <tr>
                  <td class="mono">{p.number}</td>
                  <th scope="row">
                    <button class="cellbtn" aria-pressed={this.selectedStep === s.stepId ? 'true' : 'false'} onClick={() => this.select(s.stepId)}>
                      {s.stepId}
                    </button>
                  </th>
                  <td>
                    {s.source}
                    {source?.type === 'asyncapi' ? ' (AsyncAPI, not runnable)' : ''}
                    {source && !source.linked ? ' (not linked)' : ''}
                  </td>
                  <td class="mono">{s.operation}</td>
                  <td class="mono">{p.dependsOn.length ? p.dependsOn.join(', ') : none}</td>
                  <td>
                    {s.status ? (
                      <span class={`st ${s.status}`}>
                        {icon(STATUS_ICON[s.status], 14)}
                        {status}
                      </span>
                    ) : (
                      none
                    )}
                  </td>
                  <td>
                    {this.validatesSchemas ? (
                      <ul>
                        <li>
                          Success criteria:{' '}
                          <span class={`c ${c.successCriteria}`}>
                            {icon(CHECK_ICON[c.successCriteria], 12)} {CHECK_WORD[c.successCriteria]}
                          </span>
                        </li>
                        <li>
                          Schema validation:{' '}
                          <span class={`c ${c.schemaValidation}`}>
                            {icon(CHECK_ICON[c.schemaValidation], 12)} {CHECK_WORD[c.schemaValidation]}
                          </span>
                        </li>
                      </ul>
                    ) : (
                      none
                    )}
                  </td>
                  <td>{s.actions?.length ? <ul>{s.actions.map((a) => <li>{this.actionText(a, s)}</li>)}</ul> : none}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>,
      threads.length > 0 && (
        <div class="t-threads">
          <p class="th">Data threads</p>
          <ul class="threads" aria-label="Data threads">
            {this.threadItems(threads, () => false)}
          </ul>
        </div>
      ),
    ];
  }

  /* ---------- edges (parallel branches only), measured after render ---------- */

  private measure = () => {
    const stage = this.stageEl;
    const edges = this.parallelEdges;
    let next: string[] = [];
    if (stage && edges.length) {
      const box = stage.getBoundingClientRect();
      next = edges.map((e) => {
        const a = this.nodeEls.get(e.from)?.getBoundingClientRect();
        const b = this.nodeEls.get(e.to)?.getBoundingClientRect();
        if (!a || !b || !a.width || !b.width) return '';
        const x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
        const x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top;
        const mx = (x1 + x2) / 2;
        return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      });
    }
    const key = next.join('|');
    if (key !== this.edgeKey) {
      this.edgeKey = key;
      this.edgePaths = next;
    }
  };

  componentDidRender() {
    this.measure();
  }

  componentDidLoad() {
    if (typeof ResizeObserver !== 'undefined' && this.stageEl) {
      this.resizer = new ResizeObserver(() => this.measure());
      this.resizer.observe(this.stageEl);
    }
  }

  disconnectedCallback() {
    this.resizer?.disconnect();
    this.resizer = undefined;
  }

  /* ---------- actions row: end branch and retry loop, drawn above the step ---------- */

  private renderActions(steps: LoomStep[], layout: LoomLayout, grid: LoomGrid, lane: number) {
    const items: unknown[] = [];
    steps.forEach((s, idx) => {
      const pl = layout.placements[idx];
      if (!pl || pl.lane !== lane) return;
      const c = grid.centre(pl.column + 1);
      const end = s.actions?.find((a): a is Extract<LoomAction, { type: 'end' }> => a.type === 'end');
      const retry = s.actions?.find((a): a is Extract<LoomAction, { type: 'retry' }> => a.type === 'retry');
      if (end) {
        const taken = end.taken === true;
        const state = end.taken === undefined ? '' : `${taken ? 'taken' : 'not taken'}${end.runLabel ? ` in ${end.runLabel}` : ''}`;
        items.push(
          <span class="end-label" style={{ left: `calc(${grid.pct(c)} + 6px)` }}>
            {`end if ${end.label ?? end.criteria}`}
            {state && <span class="note">{` · ${state}`}</span>}
          </span>,
          <span class={{ 'end-v': true, on: taken }} style={{ left: grid.pct(c) }} />,
          <span class={{ 'end-h': true, on: taken }} style={{ left: grid.pct(c), width: grid.pct(0.3) }} />,
          <span class={{ 'end-pill': true, on: taken }} style={{ left: grid.pct(c + 0.3) }}>
            {icon('end', 11, 2.4)}
            end
          </span>,
        );
      }
      if (retry) {
        const applied = !!retry.applied;
        const x = grid.pct(c + 0.08);
        const attempts = applied && s.attempts ? ` · ${plural(s.attempts, 'attempt')}${retry.runLabel ? ` in ${retry.runLabel}` : ''}` : '';
        items.push(
          <svg class={{ loop: true, bad: applied }} style={{ left: x }} width="28" height="32" viewBox="0 0 28 32" fill="none" stroke-width="1.6" aria-hidden="true" focusable="false">
            <path d="M5 32V15a9 9 0 0 1 18 0v13" />
            <path d="M19 25l4 5 4-5" />
          </svg>,
          <span class="retry-label" style={{ left: `calc(${x} + 32px)` }}>
            {`retry ×${retry.retryLimit} · ${seconds(retry.retryAfter)}`}
            {attempts && <span class="bad">{attempts}</span>}
          </span>,
        );
      }
    });
    return items;
  }

  render() {
    const sources = parseJson<LoomSource[]>(this.sources, []);
    const steps = parseJson<LoomStep[]>(this.steps, []);
    const threads = parseJson<LoomThread[]>(this.threads, []);
    const inputs = parseJson<(string | LoomInput)[]>(this.inputs, []).map((i) => (typeof i === 'string' ? { name: i } : i));
    const outputs = parseJson<(string | LoomOutput)[]>(this.outputs, []).map((o) => (typeof o === 'string' ? { name: o } : o));
    const layout = layoutLoom(steps, sources);
    const lanes = [...sources];
    layout.placements.forEach((p) => {
      if (!lanes[p.lane]) lanes[p.lane] = { name: steps[p.number - 1]?.source ?? '', type: 'openapi', protocol: 'REST', linked: true };
    });
    const grid = loomGrid(layout.columns);
    const parallel = steps.some((s) => s.dependsOn !== undefined);
    this.parallelEdges = parallel ? layout.edges : [];

    const firstId = layout.placements[0]?.stepId;
    const known = (id?: string) => !!id && steps.some((s) => s.stepId === id);
    const tabStop = known(this.focusId) ? this.focusId : known(this.selectedStep) ? this.selectedStep : firstId;
    const involves = (t: LoomThread, id: string) => t.from === id || t.to === id;
    const isDim = (t: LoomThread) => !!this.hot && !involves(t, this.hot);

    // Grid rows: per lane, a header, an actions row when a step has actions, then one row per parallel branch.
    let row = 1;
    const laneRows = lanes.map((_, i) => {
      const header = row++;
      const hasActions = steps.some((s, idx) => layout.placements[idx]?.lane === i && (s.actions ?? []).some((a) => a.type === 'end' || a.type === 'retry'));
      const actions = hasActions ? row++ : undefined;
      const first = row;
      row += layout.laneRows[i] ?? 1;
      return { header, actions, first };
    });
    const nodeFirst = laneRows[0]?.first ?? 1;
    const nodeEnd = row;
    const laneColor = (l: LoomSource) => `var(--${PROTOCOL_TOKEN[l.protocol] ?? PROTOCOL_TOKEN.REST})`;

    const graph = (
      <div class="scroll" role="region" aria-label={`${this.label}, diagram`} tabindex={0}>
        <div
          class="stage"
          style={{ gridTemplateColumns: grid.template, minWidth: `${Math.max(740, 140 * grid.steps + 180)}px` }}
          ref={(el) => (this.stageEl = el)}
        >
          {this.edgePaths.length > 0 && (
            <svg class="edges" aria-hidden="true" focusable="false">
              <defs>
                <marker id={`ah-${this.uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path class="ah" d="M1 1 L9 5 L1 9" fill="none" stroke-width="1.6" />
                </marker>
              </defs>
              {this.edgePaths.map((d) => (d ? <path class="edge" d={d} marker-end={`url(#ah-${this.uid})`} /> : null))}
            </svg>
          )}
          {lanes.map((l, i) => {
            const r = laneRows[i]!;
            return [
              <div class="lane-head" style={{ gridRow: `${r.header}` }}>
                <span class="badge" style={{ '--lane': laneColor(l) }}>
                  <span class="bp">{l.protocol}</span>
                  <span class="bn">{l.name}</span>
                </span>
                <span class="lt">{l.serviceLabel ? `${l.type} · ${l.serviceLabel}` : l.type}</span>
                {l.type === 'asyncapi' && <span>AsyncAPI, not runnable</span>}
                {!l.linked && (
                  <span class="warn">
                    {icon('warning', 12)}
                    Not linked
                  </span>
                )}
              </div>,
              r.actions !== undefined && (
                <div class="acts" aria-hidden="true" style={{ gridRow: `${r.actions}` }}>
                  {this.renderActions(steps, layout, grid, i)}
                </div>
              ),
              ...Array.from({ length: layout.laneRows[i] ?? 1 }, (_, k) => (
                <div class="warp" aria-hidden="true" style={{ gridRow: `${r.first + k}`, '--lane': laneColor(l) }} />
              )),
            ];
          })}
          {inputs.length > 0 && (
            <div class="io in" style={{ gridRow: `${nodeFirst} / ${nodeEnd}` }}>
              <span class="io-h">inputs</span>
              {inputs.map((n) => (
                <span class="io-chip">
                  <span class="io-x">{n.expression ?? `$inputs.${n.name}`}</span>
                  {n.value !== undefined && <span class="io-v">{n.value}</span>}
                </span>
              ))}
            </div>
          )}
          {outputs.length > 0 && (
            <div class="io out" style={{ gridRow: `${nodeFirst} / ${nodeEnd}` }}>
              <span class="io-h">outputs</span>
              {outputs.map((o) => (
                <span class="io-chip">
                  <span class="io-x">{o.name}</span>
                  <span class={{ 'io-v': true, none: o.value === undefined }}>{o.value ?? '—'}</span>
                </span>
              ))}
              {this.outputNote && <span class="io-note">{this.outputNote}</span>}
            </div>
          )}
          {steps.map((s, idx) => {
            const pl = layout.placements[idx];
            if (!pl) return null;
            const r = laneRows[pl.lane]!;
            const source = lanes[pl.lane];
            const desc = this.description(s, source);
            const descId = `d-${this.uid}-${idx}`;
            return (
              <div class="cell" style={{ gridColumn: `${pl.column + 2}`, gridRow: `${r.first + pl.row}`, '--lane': laneColor(source ?? lanes[0]!) }}>
                {this.renderNode(s, pl, layout, tabStop, desc ? descId : undefined, source?.protocol ?? 'REST')}
                {desc && (
                  <span id={descId} class="sr">
                    {desc}
                  </span>
                )}
              </div>
            );
          })}
          {threads.length > 0 && (
            <ul class="threads" aria-label="Data threads" style={{ gridRow: `${nodeEnd}` }}>
              {this.threadItems(threads, isDim)}
            </ul>
          )}
        </div>
      </div>
    );

    const ioBar = [
      inputs.length > 0 && (
        <div class="io-line">
          <span>Inputs</span>
          {inputs.map((n) => (
            <code>{n.value !== undefined ? `${n.name} = ${n.value}` : n.name}</code>
          ))}
        </div>
      ),
      outputs.length > 0 && (
        <div class="io-line">
          <span>Outputs</span>
          {outputs.map((o) => (
            <code>{o.value !== undefined ? `${o.name} = ${o.value}` : o.name}</code>
          ))}
        </div>
      ),
    ];

    return (
      <Host>
        <div role="group" aria-label={this.label}>
          <div class="bar">
            {this.asTable && ioBar}
            <button type="button" class="toggle" aria-pressed={this.asTable ? 'true' : 'false'} onClick={() => (this.asTable = !this.asTable)}>
              {icon('table', 14)}
              Show as table
            </button>
          </div>
          {this.asTable ? this.renderTable(layout, steps, lanes, threads) : graph}
        </div>
      </Host>
    );
  }
}
