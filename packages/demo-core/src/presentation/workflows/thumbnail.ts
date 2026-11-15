import type { ArazzoDocument, StepStatus, Workflow, WorkflowRun } from '../../domain/arazzo/index.js';

const PROTO_VAR: Record<string, string> = {
  REST: 'var(--proto-rest)',
  SOAP: 'var(--proto-soap)',
  EVENT: 'var(--proto-event)',
  gRPC: 'var(--proto-grpc)',
  GRAPHQL: 'var(--proto-graphql)',
  DIRECT: 'var(--proto-direct)',
  A2A: 'var(--proto-a2a)',
};

/** Colour of a source lane: its protocol when linked, warning when not. */
export function sourceColor(document: ArazzoDocument, sourceName: string): { color: string; linked: boolean } {
  const source = document.sources.find((s) => s.name === sourceName);
  if (!source || source.link.status !== 'linked') return { color: 'var(--warning)', linked: false };
  return { color: PROTO_VAR[source.link.protocol] ?? 'var(--proto-rest)', linked: true };
}

type Dot = 'ok' | 'ko' | 'skip' | 'never';
const DOT_OF: Record<StepStatus, Dot> = { passed: 'ok', failed: 'ko', 'not-run': 'skip' };
const WORD: Record<Dot, string> = { ok: 'passed', ko: 'failed', skip: 'not reached', never: 'never run' };
const SPACING = 22;
const PADX = 6;
const LANE_GAP = 12;
const LANE_Y0 = 7;

interface Lane { top: number; width: number; color: string; dashed: boolean }
interface Link { left: number; top: number; height: number }
interface DotPos { left: number; top: number; state: Dot }

/** Geometry and text alternative of the workflow's lanes, steps and parallel branches. */
export function thumbnail(workflow: Workflow, document: ArazzoDocument, run?: WorkflowRun) {
  const steps = workflow.steps;
  const stateOf = (i: number): Dot => {
    const result = run?.steps[i];
    return result ? DOT_OF[result.status] : 'never';
  };
  const disabled = !workflow.runnability.runnable;
  const parallel = steps.some((s) => s.dependsOn?.length);
  let lanes: Lane[];
  let links: Link[];
  let dots: DotPos[];
  let width: number;
  let height: number;
  let label: string;
  const runLead = run ? `Run #${run.number}: ` : 'Never run: ';

  if (parallel) {
    const col: Record<string, number> = {};
    const rowsInCol: Record<number, number> = {};
    const raw = steps.map((s) => {
      const c = s.dependsOn?.length ? Math.max(...s.dependsOn.map((id) => col[id] ?? 0)) + 1 : 0;
      col[s.stepId] = c;
      rowsInCol[c] = (rowsInCol[c] ?? 0) + 1;
      return { c, r: (rowsInCol[c] ?? 1) - 1 };
    });
    const maxRows = Math.max(...Object.values(rowsInCol));
    const pos = raw.map((p) => ({ c: p.c, r: rowsInCol[p.c] === 1 ? (maxRows - 1) / 2 : p.r }));
    const nCols = Math.max(...pos.map((p) => p.c)) + 1;
    width = PADX * 2 + (nCols - 1) * SPACING;
    const joinX = PADX + SPACING / 2;
    const { color } = sourceColor(document, steps[0]?.sourceName ?? '');
    const mid = (maxRows - 1) / 2;
    lanes = Array.from({ length: maxRows }, (_, r) => ({ top: LANE_Y0 + r * LANE_GAP - 1, width: r === mid ? width : joinX, color, dashed: false }));
    links = [{ left: joinX, top: LANE_Y0, height: (maxRows - 1) * LANE_GAP }];
    dots = steps.map((_, i) => ({ left: PADX + (pos[i]?.c ?? 0) * SPACING - 5, top: LANE_Y0 + (pos[i]?.r ?? 0) * LANE_GAP - 5, state: stateOf(i) }));
    height = LANE_Y0 * 2 + (maxRows - 1) * LANE_GAP;
    const firsts = steps.filter((s) => !s.dependsOn?.length).map((s) => s.stepId);
    const thens = steps.filter((s) => s.dependsOn?.length);
    label =
      `${steps.length} steps: ${firsts.join(', ')} in parallel, then ${thens.map((s) => s.stepId).join(', ')}. ` +
      runLead +
      steps.map((s, i) => `${s.stepId}${s.dependsOn?.length ? ` (dependsOn ${s.dependsOn.join(', ')})` : ''} ${WORD[stateOf(i)]}`).join(', ') +
      '.';
  } else {
    const keys: string[] = [];
    for (const s of steps) if (!keys.includes(s.sourceName)) keys.push(s.sourceName);
    const laneY = (k: string) => LANE_Y0 + keys.indexOf(k) * LANE_GAP;
    width = PADX * 2 + (steps.length - 1) * SPACING;
    height = LANE_Y0 * 2 + (keys.length - 1) * LANE_GAP;
    lanes = keys.map((k) => {
      const { color, linked } = sourceColor(document, k);
      return { top: laneY(k) - 1, width, color, dashed: !linked };
    });
    dots = steps.map((s, i) => ({ left: PADX + i * SPACING - 5, top: laneY(s.sourceName) - 5, state: stateOf(i) }));
    links = [];
    for (let i = 0; i < steps.length - 1; i++) {
      const a = steps[i]?.sourceName ?? '';
      const b = steps[i + 1]?.sourceName ?? '';
      if (a !== b) links.push({ left: PADX + i * SPACING + SPACING / 2, top: Math.min(laneY(a), laneY(b)), height: Math.abs(laneY(b) - laneY(a)) });
    }
    label =
      `${steps.length} steps on ${keys.length} ${keys.length === 1 ? 'lane' : 'lanes'} (${keys.join(', ')}). ` +
      runLead +
      steps.map((s, i) => `${s.stepId} ${WORD[stateOf(i)]}`).join(', ') +
      '.';
  }
  return { disabled, lanes, links, dots, width, height, label };
}
