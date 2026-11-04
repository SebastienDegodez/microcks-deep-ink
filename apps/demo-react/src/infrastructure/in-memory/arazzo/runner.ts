import {
  runFrames,
  simulateRun,
  type RunOrigin,
  type WorkflowRun,
} from '@/domain/arazzo';
import type { StartRunRequest, WorkflowRunner } from '@/application/ports/arazzo';
import { NotFoundError } from '@/application/shared';
import type { Clock } from '@/application/ports/shared';
import { RUN_IDS, TEST_RUN_IDS, TICK_MS, after, createSequenceStream, isFastMode, scenarioRun } from '../shared';
import type { ArazzoState } from './run-store';
import { baseUrlFor, createResponder } from './world';

/**
 * The seeded run a request replays. The three prototype scenarios (and the check-menu run) keep their
 * ids, so the links of the story stay stable: run #14 <-> test run #119, Live traces, Copilot.
 */
export function canonicalRunId(request: StartRunRequest): string | undefined {
  const { workflowId, target, options } = request;
  if (workflowId === 'check-menu' && target.kind === 'mocks') return RUN_IDS.checkMenu3;
  if (workflowId !== 'restock-pastry') return undefined;
  const size = options.inputs['size'];
  if (target.kind === 'implementations' && options.example === 'restock-eclair' && options.validateSchemas && options.inputs['newPrice'] === 3.9) {
    return RUN_IDS[14];
  }
  if (target.kind === 'mocks' && options.example === 'already-available') return RUN_IDS[15];
  if (target.kind === 'mocks' && !options.example && size === 'S') return RUN_IDS[16];
  return undefined;
}

/**
 * In-memory workflow runner. `start` plays the whole workflow at once with the domain simulation
 * (`simulateRun` over `playWorkflow`: success criteria, schema validation, retry and end actions) against the
 * simulated world, and stores the finished run. `watch` then replays it step by step: one frame per attempt,
 * every 1200 ms (no delay in fast mode), the last frame being the final run.
 */
export function createRunner(state: ArazzoState, clock: Clock): WorkflowRunner {
  return {
    start: (request) =>
      after(() => {
        const known = canonicalRunId(request);
        if (known && !state.runs.some((r) => r.id === known)) {
          // Runs #15 and #16 are created by their scenario, at the time it is launched.
          const scenario = scenarioRun(known, clock.now().toISOString());
          if (scenario) state.runs.push(scenario);
        }
        if (known && state.runs.some((r) => r.id === known)) return known;
        const workflow = state.workflows.find((w) => w.documentId === request.documentId && w.workflowId === request.workflowId);
        if (!workflow) throw new NotFoundError('Workflow', request.workflowId);
        const runId = state.newRunId();
        const run = simulateRun({
          runId,
          number: state.nextNumber(request.documentId, request.workflowId),
          workflow,
          origin: request.origin satisfies RunOrigin,
          target: request.target,
          options: request.options,
          startedAt: clock.now().toISOString(),
          respond: createResponder(request.target, request.options),
          baseUrl: (source) => baseUrlFor(request.target, source),
        });
        const failedOnSchema = run.steps.some((s) => s.schema.state === 'fail');
        // Same bug as test run #119: the staging API breaks its schema on patchPastry.
        state.runs.push(failedOnSchema && request.workflowId === 'restock-pastry' ? { ...run, relatedTestRunId: TEST_RUN_IDS.failed } : run);
        return runId;
      }),
    watch: (runId) => {
      const run = state.runs.find((r) => r.id === runId) ?? scenarioRun(runId);
      const frames: WorkflowRun[] = run ? runFrames(run) : [];
      return (listener) =>
        createSequenceStream(frames, { immediate: true, intervalMs: isFastMode() ? 1 : TICK_MS })(listener);
    },
  };
}
