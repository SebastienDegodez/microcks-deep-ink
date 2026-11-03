import { Component, Host, Prop, State, h } from '@stencil/core';
import { PROTOCOL_TOKEN, WorkflowGoto, WorkflowSource, WorkflowStep, WorkflowThread, parseJson } from '../../utils/types';

const COL = 200;
const NODE_W = 160;
const NODE_H = 76;
const LANE_H = 120;
const TOP = 28;

/**
 * Arazzo workflow as a loom: one lane per sourceDescription (warp), steps as nodes,
 * data threads between steps (weft). Each step carries a double proof: criteria and contract.
 */
@Component({
  tag: 'mk-workflow-loom',
  shadow: true,
  styles: `
    :host { display: block; color: var(--text); }
    .wrap { overflow-x: auto; padding-bottom: var(--space-2); }
    .loom { position: relative; }
    svg.bg { position: absolute; inset: 0; overflow: visible; }
    .lane-label { position: absolute; left: 0; font: 400 11px/14px var(--font-mono); color: var(--text-muted); }
    .node { all: unset; box-sizing: border-box; cursor: pointer; position: absolute; width: 160px; min-height: 76px; background: var(--surface); border: 1.5px solid; border-radius: var(--radius-node); padding: 8px 10px; }
    .node:focus-visible { box-shadow: var(--shadow-focus); }
    .id { font: 600 12px/16px var(--font-mono); }
    .op { font: 400 11px/16px var(--font-mono); color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pr { display: flex; gap: 8px; margin-top: 4px; font: 600 11px/14px var(--font-ui); }
    .pass { color: var(--success); } .fail { color: var(--danger); } .pending { color: var(--text-muted); }
    .retry { position: absolute; font: 400 10px/12px var(--font-mono); color: var(--text-muted); }
    path.w { fill: none; stroke: var(--link); stroke-width: 1.5; transition: opacity .15s; }
    path.goto { stroke-dasharray: 4 4; stroke: var(--text-muted); }
    path.dim { opacity: .15; }
    .threads { list-style: none; margin: var(--space-3) 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .thread { font: 400 11px/16px var(--font-mono); color: var(--link); transition: opacity .15s; }
    .thread.dim { opacity: .25; }
    .hop { display: inline-block; min-width: 44px; color: var(--text-muted); }
  `,
})
export class MkWorkflowLoom {
  @Prop() sources: WorkflowSource[] | string = [];
  @Prop() steps: WorkflowStep[] | string = [];
  @Prop() threads: WorkflowThread[] | string = [];
  @Prop() gotos: WorkflowGoto[] | string = [];

  @State() focus?: string;

  private mark(v: 'pass' | 'fail' | 'pending') {
    return v === 'pass' ? '✓' : v === 'fail' ? '✕' : '…';
  }

  render() {
    const sources = parseJson<WorkflowSource[]>(this.sources, []);
    const steps = parseJson<WorkflowStep[]>(this.steps, []);
    const threads = parseJson<WorkflowThread[]>(this.threads, []);
    const gotos = parseJson<WorkflowGoto[]>(this.gotos, []);

    const laneOf = (s: string) => Math.max(0, sources.findIndex((x) => x.name === s));
    const pos = new Map<string, { x: number; y: number }>();
    steps.forEach((s, i) => pos.set(s.stepId, { x: i * COL, y: TOP + laneOf(s.source) * LANE_H }));
    const width = Math.max(1, steps.length) * COL - (COL - NODE_W);
    const height = TOP + Math.max(1, sources.length) * LANE_H - (LANE_H - NODE_H) + (gotos.length ? 44 : 8);

    const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
      const mx = (x1 + x2) / 2;
      return `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    };
    const loop = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const x1 = a.x + NODE_W / 2, y1 = a.y + NODE_H, x2 = b.x + NODE_W / 2;
      const low = y1 + 34;
      return `M${x1} ${y1} C ${x1} ${low}, ${x2} ${low}, ${x2} ${y1}`;
    };
    const isDim = (t: WorkflowThread) => !!this.focus && t.from !== this.focus && t.to !== this.focus;

    return (
      <Host role="img" aria-label={`Arazzo workflow with ${steps.length} steps across ${sources.length} sources`}>
        <div class="wrap">
          <div class="loom" style={{ width: `${width}px`, height: `${height}px` }}>
            <svg class="bg" width={width} height={height} aria-hidden="true">
              {sources.map((s, i) => (
                <line
                  x1="0"
                  x2={width}
                  y1={TOP + i * LANE_H + NODE_H / 2}
                  y2={TOP + i * LANE_H + NODE_H / 2}
                  stroke={`var(--${PROTOCOL_TOKEN[s.protocol]})`}
                  stroke-width="2"
                  opacity="0.45"
                />
              ))}
              {threads.map((t) => {
                const a = pos.get(t.from), b = pos.get(t.to);
                return a && b ? <path class={{ w: true, dim: isDim(t) }} d={curve(a, b)} /> : null;
              })}
              {gotos.map((g) => {
                const a = pos.get(g.from), b = pos.get(g.to);
                return a && b ? <path class="w goto" d={loop(a, b)} /> : null;
              })}
            </svg>
            {sources.map((s, i) => (
              <div class="lane-label" style={{ top: `${TOP + i * LANE_H - 20}px` }}>
                {s.name} · {s.protocol}
              </div>
            ))}
            {steps.map((s, i) => {
              const p = pos.get(s.stepId)!;
              const proto = sources[laneOf(s.source)]?.protocol ?? 'REST';
              return [
                <button
                  class="node"
                  style={{ left: `${p.x}px`, top: `${p.y}px`, borderColor: `var(--${PROTOCOL_TOKEN[proto]})` }}
                  aria-label={`Step ${i + 1} ${s.stepId}, ${s.operation}, criteria ${s.criteria}, contract ${s.contract}`}
                  onMouseEnter={() => (this.focus = s.stepId)}
                  onMouseLeave={() => (this.focus = undefined)}
                  onFocus={() => (this.focus = s.stepId)}
                  onBlur={() => (this.focus = undefined)}
                >
                  <div class="id">
                    {i + 1} {s.stepId}
                  </div>
                  <div class="op">{s.operation}</div>
                  <div class="pr">
                    <span class={s.criteria}>{this.mark(s.criteria)} criteria</span>
                    <span class={s.contract}>{this.mark(s.contract)} contract</span>
                  </div>
                </button>,
                s.retry && (
                  <span class="retry" style={{ left: `${p.x}px`, top: `${p.y - 14}px` }}>
                    ↻ {s.retry}
                  </span>
                ),
              ];
            })}
          </div>
        </div>
        {threads.length > 0 && (
          <ul class="threads" aria-label="Data threads">
            {threads.map((t) => {
              const from = steps.findIndex((s) => s.stepId === t.from) + 1;
              const to = steps.findIndex((s) => s.stepId === t.to) + 1;
              return (
                <li class={{ thread: true, dim: isDim(t) }}>
                  <span class="hop">
                    {from} → {to}
                  </span>
                  {t.expression}
                </li>
              );
            })}
          </ul>
        )}
      </Host>
    );
  }
}
