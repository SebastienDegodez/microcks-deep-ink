import type { TestRun, TestStepResult } from './types';

export type LogLevel = 'INFO' | 'SEND' | 'PASS' | 'FAIL' | 'WAIT';

export interface LogLine {
  time: string;
  level: LogLevel;
  message: string;
  /** `emphasis`: an operation or the completion line; `error`: a failed check or the failed result; `muted`: waiting. */
  tone?: 'emphasis' | 'error' | 'muted';
}

/** " against Pastry" or " against Pastry[] (2)", from the step's schema reference. */
function schemaOf(step: TestStepResult): string {
  const name = step.schemaRef?.split('/').pop();
  if (!name) return '';
  return Array.isArray(step.payload) ? ` against ${name}[] (${step.payload.length})` : ` against ${name}`;
}

const two = (n: number, w = 2) => String(n).padStart(w, '0');

function clock(ms: number): string {
  return `${two(Math.floor(ms / 3_600_000))}:${two(Math.floor(ms / 60_000) % 60)}:${two(Math.floor(ms / 1000) % 60)}.${two(ms % 1000, 3)}`;
}

/** Elapsed time of a run once `finished` steps are done: 140 ms of setup, then each call and 60 ms of validation. */
export function elapsedMs(run: Pick<TestRun, 'steps'>, finished: number): number {
  return 140 + run.steps.slice(0, finished).reduce((n, s) => n + s.ms + 60, 0);
}

/**
 * The runner log of a run: what Microcks did, step by step, until `finished` steps are done. While the run is
 * executing the next call shows a "waiting" line. Pure: the page only shows it.
 */
export function buildRunnerLog(run: TestRun, finished: number, done: boolean): LogLine[] {
  const start = new Date(run.startedAt);
  let now = ((start.getUTCHours() * 60 + start.getUTCMinutes()) * 60 + start.getUTCSeconds()) * 1000 + 112;
  const lines: LogLine[] = [];
  const log = (level: LogLevel, message: string, tone?: LogLine['tone']) => lines.push({ time: clock(now), level, message, ...(tone ? { tone } : {}) });
  const labels = run.operationLabels ?? [];
  const label = (id: string) => {
    const op = labels.find((o) => o.id === id);
    return op ? `${op.method} ${op.path}` : id;
  };
  log('INFO', `Test #${run.id} started · runner ${run.runner} · timeout ${Math.round(run.timeoutMs / 1000)} s`);
  now += 28;
  log('INFO', `Contract ${run.contractFile ? `${run.contractFile} ` : ''}loaded · ${labels.length || new Set(run.steps.map((s) => s.operationId)).size} operations · ${run.steps.length} test steps`);
  now += 112;
  const last = done ? run.steps.length - 1 : finished;
  for (let i = 0; i <= last && i < run.steps.length; i += 1) {
    const step = run.steps[i];
    if (!step) break;
    if (i === 0 || run.steps[i - 1]?.operationId !== step.operationId) log('INFO', `Operation ${label(step.operationId)}`, 'emphasis');
    log('SEND', `→ ${step.method} ${run.endpoint}${step.path}${step.requestBody ? `  ${step.requestBody}` : ''}`);
    if (i < finished || done) {
      now += step.ms;
      if (step.result === 'failed') {
        log('FAIL', `← ${step.httpStatus ?? 200} application/json · ${step.ms} ms · ${step.violations.length} schema ${step.violations.length === 1 ? 'violation' : 'violations'}`, 'error');
        for (const v of step.violations) log('FAIL', `  ${v.path} ${v.raw ?? v.message}`);
      } else {
        log('PASS', `← ${step.httpStatus ?? 200} application/json · ${step.ms} ms · body valid${schemaOf(step)}`);
      }
      now += 60;
    } else {
      now += 12;
      log('WAIT', '  waiting for response…', 'muted');
    }
  }
  if (done) {
    const passed = run.steps.filter((s) => s.result === 'passed').length;
    log('INFO', `Test #${run.id} completed in ${elapsedMs(run, run.steps.length)} ms · ${passed}/${run.steps.length} steps passed · conformance ${Math.round((100 * passed) / Math.max(1, run.steps.length))}%`, 'emphasis');
    const broken = [...new Set(run.steps.filter((s) => s.result === 'failed').map((s) => s.operationId))].map(label);
    const ok = run.result === 'passed';
    log(ok ? 'INFO' : 'FAIL', `Result: ${run.result.toUpperCase()}${!ok && broken.length ? ` · ${broken.join(', ')} broke ${broken.length === 1 ? 'its' : 'their'} contract` : ''}`, ok ? 'emphasis' : 'error');
  }
  return lines;
}
