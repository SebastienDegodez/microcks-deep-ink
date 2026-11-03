import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { icon } from '../../utils/icons';
import { LoomLayout, LoomPlacement, layoutLoom } from '../../utils/loom-layout';
import {
  CheckState,
  LoomAction,
  LoomSource,
  LoomStep,
  LoomThread,
  PROTOCOL_TOKEN,
  StepStatus,
  parseJson,
} from '../../utils/types';

const COL = 276;
const NODE_W = 232;
const LANE_LABEL_H = 26;
const THREAD_H = 20;
const RETRY_HEAD = 46;
const PLAIN_HEAD = 8;

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

/** Text glyphs for the node (decorative; the word next to them carries the meaning). */
const GLYPH: Record<StepStatus | CheckState, string> = {
  passed: '✓',
  failed: '✕',
  'not-run': '–',
  off: '–',
  'not-evaluated': '○',
};

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
    .io { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font: var(--type-small); color: var(--text-secondary); }
    .io code { font: 400 12px/16px var(--font-mono); color: var(--text); background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--radius-control); padding: 2px 6px; }
    .toggle { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 4px 12px; font: 600 13px/18px var(--font-ui); color: var(--text); background: var(--surface); border: 1px solid var(--border-control); border-radius: var(--radius-control); cursor: pointer; }
    .toggle[aria-pressed="true"] { background: var(--selected); border-color: var(--action); }
    button:focus-visible, .scroll:focus-visible { outline: 2px solid var(--action); outline-offset: 2px; box-shadow: var(--shadow-focus); }
    .scroll { overflow: auto; padding: 4px 4px 12px; border-radius: var(--radius-panel); }
    .loom { position: relative; }
    svg.bg { position: absolute; left: 0; top: 0; overflow: visible; }
    .lane-label { position: absolute; left: 0; display: flex; gap: 10px; align-items: center; white-space: nowrap; font: 400 12px/16px var(--font-mono); color: var(--text-secondary); }
    .lane-label .warn { display: inline-flex; align-items: center; gap: 4px; color: var(--warning); font-weight: 600; }
    .node { position: absolute; display: flex; flex-direction: column; gap: 2px; width: 232px; padding: 8px 10px; text-align: left; color: var(--text); background: var(--surface); border: 1.5px solid; border-radius: var(--radius-node); cursor: pointer; font: inherit; }
    .node[data-status="not-run"] { border-style: dashed; }
    .node[aria-pressed="true"] { background: var(--selected); box-shadow: 0 0 0 2px var(--action); }
    .node[aria-pressed="true"]:focus-visible { box-shadow: 0 0 0 2px var(--action), var(--shadow-focus); }
    .id { font: 600 12px/16px var(--font-mono); }
    .op { font: 400 11px/16px var(--font-mono); color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .st { display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; font: 600 12px/16px var(--font-ui); }
    .st.passed { color: var(--success); }
    .st.failed { color: var(--danger); }
    .st.not-run { color: var(--text-muted); }
    .gl { font-weight: 700; }
    .checks { display: flex; flex-direction: column; margin-top: 2px; }
    .checks .chk { display: flex; white-space: nowrap; justify-content: space-between; gap: 6px; font: 400 11px/16px var(--font-ui); color: var(--text-secondary); }
    .checks .c { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; }
    .c.passed { color: var(--success); }
    .c.failed { color: var(--danger); }
    .c.off, .c.not-evaluated { color: var(--text-muted); }
    .alabel { position: absolute; white-space: nowrap; font: 400 11px/14px var(--font-mono); color: var(--text-secondary); }
    .alabel.on { color: var(--success); font-weight: 600; }
    .alabel.bad { color: var(--danger); font-weight: 600; }
    path.ah { stroke: var(--border-control); }
    path.edge { fill: none; stroke: var(--border-control); stroke-width: 1.5; }
    path.thread { fill: none; stroke: var(--link); stroke-width: 1.5; transition: opacity .15s; }
    path.thread.dim { opacity: .25; }
    path.act { fill: none; stroke: var(--border-control); stroke-width: 1.6; }
    path.act.dashed { stroke-dasharray: 4 3; }
    path.act.on { stroke: var(--success); }
    path.act.bad { stroke: var(--danger); stroke-width: 2; }
    rect.term { fill: var(--border-control); }
    rect.term.on { fill: var(--success); }
    .threads { list-style: none; margin: 0; padding: 0; }
    .threads.abs li { position: absolute; white-space: nowrap; }
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
    @media (prefers-reduced-motion: reduce) { path.thread { transition: none; } }
  `,
})
export class MkWorkflowLoom {
  private readonly uid = ++uid;
  private nodeEls = new Map<string, HTMLButtonElement>();

  @Prop() sources: LoomSource[] | string = [];
  @Prop() steps: LoomStep[] | string = [];
  @Prop() threads: LoomThread[] | string = [];
  /** Workflow input names, shown above the loom. */
  @Prop() inputs: string[] | string = [];
  /** Workflow output names, shown above the loom. */
  @Prop() outputs: string[] | string = [];
  /** When the run validates schemas, every step shows its two checks. */
  @Prop() validatesSchemas = false;
  /** Selected step id (mutable: clicking a step selects it). */
  @Prop({ mutable: true }) selectedStep?: string;
  /** Accessible name of the group. */
  @Prop() label = 'Arazzo workflow';

  @State() hot?: string;
  @State() focusId?: string;
  @State() asTable = false;

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
    const parts = [`Step ${p.number}`, s.stepId, s.operation];
    const status = this.statusPhrase(s);
    if (status) parts.push(status);
    if (this.validatesSchemas) {
      const c = this.checkStates(s);
      parts.push(`Success criteria ${CHECK_WORD[c.successCriteria].toLowerCase()}`);
      parts.push(`Schema validation ${CHECK_WORD[c.schemaValidation].toLowerCase()}`);
    }
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

  render() {
    const sources = parseJson<LoomSource[]>(this.sources, []);
    const steps = parseJson<LoomStep[]>(this.steps, []);
    const threads = parseJson<LoomThread[]>(this.threads, []);
    const inputs = parseJson<string[]>(this.inputs, []);
    const outputs = parseJson<string[]>(this.outputs, []);
    const layout = layoutLoom(steps, sources);
    const lanes = [...sources];
    layout.placements.forEach((p) => {
      if (!lanes[p.lane]) lanes[p.lane] = { name: steps[p.number - 1]?.source ?? '', type: 'openapi', protocol: 'REST', linked: true };
    });

    // Geometry
    const nodeH = this.validatesSchemas ? 112 : 78;
    const hasRetry = steps.some((s) => s.actions?.some((a) => a.type === 'retry'));
    const maxEnds = steps.reduce((m, s) => Math.max(m, (s.actions ?? []).filter((a) => a.type === 'end').length), 0);
    const head = hasRetry ? RETRY_HEAD : PLAIN_HEAD;
    const foot = maxEnds ? 20 + 16 * maxEnds : PLAIN_HEAD;
    const pitch = head + nodeH + foot;
    const padL = threads.some((t) => t.from === '$inputs') ? 56 : 8;
    const padR = threads.some((t) => t.to === '$outputs') ? 56 : 8;
    const laneY: number[] = [];
    let y = 0;
    layout.laneRows.forEach((rows, i) => {
      laneY[i] = y;
      y += LANE_LABEL_H + rows * pitch;
    });
    const lanesBottom = y;
    const pos = new Map<string, { x: number; y: number }>();
    layout.placements.forEach((p) =>
      pos.set(p.stepId, { x: padL + p.column * COL, y: (laneY[p.lane] ?? 0) + LANE_LABEL_H + p.row * pitch + head }),
    );
    const stripTop = lanesBottom + 12;
    const width = padL + Math.max(0, layout.columns - 1) * COL + NODE_W + padR;
    const height = stripTop + (threads.length ? threads.length * THREAD_H + 4 : 0);

    const mid = (n: { x: number; y: number }) => n.y + nodeH / 2;
    const edge = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const x1 = a.x + NODE_W, y1 = mid(a), x2 = b.x, y2 = mid(b);
      const mx = (x1 + x2) / 2;
      return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    };
    const threadPath = (t: LoomThread) => {
      const off = 18;
      const a = pos.get(t.from), b = pos.get(t.to);
      if (t.from === '$inputs' && b) return `M${b.x - 48} ${mid(b) + off} L${b.x - 1} ${mid(b) + off}`;
      if (t.to === '$outputs' && a) return `M${a.x + NODE_W} ${mid(a) + off} L${a.x + NODE_W + 47} ${mid(a) + off}`;
      if (!a || !b) return undefined;
      const x1 = a.x + NODE_W, y1 = mid(a) + off, x2 = b.x, y2 = mid(b) + off;
      const mx = (x1 + x2) / 2;
      return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    };
    const involves = (t: LoomThread, id: string) => t.from === id || t.to === id;
    const isDim = (t: LoomThread) => !!this.hot && !involves(t, this.hot);

    const firstId = layout.placements[0]?.stepId;
    const known = (id?: string) => !!id && steps.some((s) => s.stepId === id);
    const tabStop = known(this.focusId) ? this.focusId : known(this.selectedStep) ? this.selectedStep : firstId;

    const protoColor = (s: LoomStep) => {
      const lane = layout.placements.find((p) => p.stepId === s.stepId)?.lane ?? 0;
      return `var(--${PROTOCOL_TOKEN[lanes[lane]?.protocol ?? 'REST']})`;
    };

    const graph = (
      <div class="scroll" role="region" aria-label={`${this.label}, diagram`} tabindex={0}>
        <div class="loom" style={{ width: `${width}px`, height: `${height}px` }}>
          <svg class="bg" width={width} height={height} aria-hidden="true" focusable="false">
            <defs>
              <marker id={`ah-${this.uid}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path class="ah" d="M1 1 L9 5 L1 9" fill="none" stroke-width="1.6" />
              </marker>
            </defs>
            {lanes.map((l, i) =>
              Array.from({ length: layout.laneRows[i] ?? 1 }, (_, r) => {
                const ly = (laneY[i] ?? 0) + LANE_LABEL_H + r * pitch + head + nodeH / 2;
                return (
                  <line
                    x1={0}
                    x2={width}
                    y1={ly}
                    y2={ly}
                    stroke={`var(--${PROTOCOL_TOKEN[l.protocol]})`}
                    stroke-width="2"
                    opacity="0.45"
                  />
                );
              }),
            )}
            {layout.edges.map((e) => {
              const a = pos.get(e.from), b = pos.get(e.to);
              return a && b ? <path class="edge" d={edge(a, b)} marker-end={`url(#ah-${this.uid})`} /> : null;
            })}
            {threads.map((t) => {
              const d = threadPath(t);
              return d ? <path class={{ thread: true, dim: isDim(t) }} d={d} /> : null;
            })}
            {steps.map((s) => {
              const p = pos.get(s.stepId);
              if (!p) return null;
              const acts = s.actions ?? [];
              const retries = acts.filter((a) => a.type === 'retry');
              const ends = acts.filter((a) => a.type === 'end');
              return [
                ...retries.map((a, k) => {
                  const applied = a.type === 'retry' && a.applied;
                  const x1 = p.x + 28 + k * 8, x2 = p.x + NODE_W - 28 - k * 8;
                  return (
                    <path
                      class={{ act: true, bad: !!applied }}
                      d={`M${x2} ${p.y} C ${x2} ${p.y - 30}, ${x1} ${p.y - 30}, ${x1} ${p.y - 1}`}
                      marker-end={`url(#ah-${this.uid})`}
                    />
                  );
                }),
                ...ends.map((a, k) => {
                  const taken = a.type === 'end' && a.taken === true;
                  const bx = p.x + 20 + (ends.length - 1 - k) * 14;
                  const ty = p.y + nodeH + 14 + 16 * k;
                  return [
                    <path class={{ act: true, on: taken, dashed: !taken }} d={`M${bx} ${p.y + nodeH} L${bx} ${ty}`} />,
                    <rect class={{ term: true, on: taken }} x={bx - 4} y={ty - 4} width="8" height="8" rx="1.5" />,
                  ];
                }),
              ];
            })}
          </svg>
          {lanes.map((l, i) => (
            <div class="lane-label" style={{ top: `${(laneY[i] ?? 0) + 2}px` }}>
              <span>
                {l.name} · {l.protocol}
              </span>
              {l.type === 'asyncapi' && <span>AsyncAPI, not runnable</span>}
              {!l.linked && (
                <span class="warn">
                  {icon('warning', 12)}
                  Not linked
                </span>
              )}
            </div>
          ))}
          {steps.map((s, idx) => {
            const p = pos.get(s.stepId);
            const pl = layout.placements[idx];
            if (!p || !pl) return null;
            const source = lanes[pl.lane];
            const desc = this.description(s, source);
            const descId = `d-${this.uid}-${idx}`;
            const pressed = this.selectedStep === s.stepId;
            const c = this.checkStates(s);
            const acts = s.actions ?? [];
            const retries = acts.filter((a) => a.type === 'retry');
            const ends = acts.filter((a) => a.type === 'end');
            return [
              <button
                type="button"
                class="node"
                data-status={s.status}
                style={{ left: `${p.x}px`, top: `${p.y}px`, height: `${nodeH}px`, borderColor: protoColor(s) }}
                aria-pressed={pressed ? 'true' : 'false'}
                aria-label={this.accessibleName(s, pl)}
                aria-describedby={desc ? descId : undefined}
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
                <span class="id">
                  {pl.number} {s.stepId}
                </span>{' '}
                <span class="op">{s.operation}</span>{' '}
                {s.status && (
                  <span class={`st ${s.status}`}>
                    <span class="gl" aria-hidden="true">
                      {GLYPH[s.status]}
                    </span>{' '}
                    {this.statusVisible(s)}
                  </span>
                )}{' '}
                {this.validatesSchemas && (
                  <span class="checks">
                    <span class="chk">
                      <span>Success criteria</span>{' '}
                      <span class={`c ${c.successCriteria}`}>
                        <span class="gl" aria-hidden="true">
                          {GLYPH[c.successCriteria]}
                        </span>{' '}
                        {CHECK_WORD[c.successCriteria]}
                      </span>
                    </span>{' '}
                    <span class="chk">
                      <span>Schema validation</span>{' '}
                      <span class={`c ${c.schemaValidation}`}>
                        <span class="gl" aria-hidden="true">
                          {GLYPH[c.schemaValidation]}
                        </span>{' '}
                        {CHECK_WORD[c.schemaValidation]}
                      </span>
                    </span>
                  </span>
                )}
              </button>,
              desc && (
                <span id={descId} class="sr">
                  {desc}
                </span>
              ),
              ...retries.map((a, k) => {
                if (a.type !== 'retry') return null;
                const text = `retry ×${a.retryLimit} · ${seconds(a.retryAfter)}${a.applied && s.attempts ? ` · ${plural(s.attempts, 'attempt')}` : ''}`;
                return (
                  <span class={{ alabel: true, bad: !!a.applied }} aria-hidden="true" style={{ left: `${p.x + 28}px`, top: `${p.y - 44 - k * 14}px` }}>
                    {text}
                  </span>
                );
              }),
              ...ends.map((a, k) => {
                if (a.type !== 'end') return null;
                const bx = p.x + 20 + (ends.length - 1 - k) * 14;
                const ty = p.y + nodeH + 14 + 16 * k;
                const state = a.taken === true ? ' · taken' : a.taken === false ? ' · not taken' : '';
                return (
                  <span class={{ alabel: true, on: a.taken === true }} aria-hidden="true" style={{ left: `${bx + 10}px`, top: `${ty - 7}px` }}>
                    {`end if ${a.criteria}${state}`}
                  </span>
                );
              }),
            ];
          })}
          {threads.length > 0 && (
            <ul class="threads abs" aria-label="Data threads">
              {this.threadItems(
                threads,
                isDim,
                (t) => (t.from === '$inputs' ? padL : (pos.get(t.from)?.x ?? padL)),
                (i) => stripTop + i * THREAD_H,
              )}
            </ul>
          )}
        </div>
      </div>
    );

    return (
      <Host>
        <div role="group" aria-label={this.label}>
          <div class="bar">
            {inputs.length > 0 && (
              <div class="io">
                <span>Inputs</span>
                {inputs.map((n) => (
                  <code>{n}</code>
                ))}
              </div>
            )}
            {outputs.length > 0 && (
              <div class="io">
                <span>Outputs</span>
                {outputs.map((n) => (
                  <code>{n}</code>
                ))}
              </div>
            )}
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
