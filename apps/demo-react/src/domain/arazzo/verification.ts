import { baggage } from './baggage';
import type { StepResult, StepStatus, WorkflowRun } from './run';
import type { Session } from './session';
import type { Workflow } from './workflow';

export interface SessionVerification {
  result: 'SUCCESS' | 'FAILURE';
  problems: { lead: string; text: string }[];
  /** Outcome of each step of the workflow, from the calls received. */
  steps: Record<string, StepStatus>;
}

/**
 * Verifies the calls a session received against the workflow: unexpected calls, contract violations,
 * data not taken from an earlier step, and steps that were never called. When a failure is injected
 * at a step, the steps after it are not expected (the application runs its compensation instead).
 */
export function verifySession(session: Pick<Session, 'calls' | 'failureInjection'>, workflow: Pick<Workflow, 'steps'>): SessionVerification {
  const problems: SessionVerification['problems'] = [];
  const statuses: Record<string, StepStatus> = {};
  const injected = session.failureInjection?.stepId;
  const injectedAt = injected ? workflow.steps.findIndex((s) => s.stepId === injected) : -1;

  workflow.steps.forEach((step, index) => {
    const calls = session.calls.filter((c) => c.stepId === step.stepId);
    if (calls.length === 0) {
      const expected = injectedAt < 0 || index <= injectedAt;
      statuses[step.stepId] = 'not-run';
      if (expected) problems.push({ lead: `Step ${index + 1}, ${step.stepId}:`, text: 'no call received for this step' });
      return;
    }
    const broken = calls.find((c) => c.dataPassing.state === 'fail' || c.contract.state === 'fail');
    statuses[step.stepId] = broken ? 'failed' : 'passed';
    for (const call of calls) {
      if (call.dataPassing.state === 'fail') {
        problems.push({
          lead: `Step ${index + 1}, ${step.stepId}:`,
          text: `data not taken from an earlier step: ${step.stepId} called with ${call.dataPassing.text}`,
        });
      }
      if (call.contract.state === 'fail') {
        problems.push({ lead: `Call #${call.n}, ${call.method} ${call.path}:`, text: `breaks the contract: ${call.contract.text}` });
      }
    }
  });
  for (const call of session.calls.filter((c) => c.stepId === 'unexpected')) {
    problems.push({
      lead: `Call #${call.n}, ${call.method} ${call.path}:`,
      text: `unexpected call${call.contract.state === 'fail' ? `, ${call.contract.text}` : ''}`,
    });
  }
  return { result: problems.length === 0 ? 'SUCCESS' : 'FAILURE', problems, steps: statuses };
}

/** The run a verification creates (origin "session", target the mocks). */
export function verificationRun(
  session: Session,
  workflow: Pick<Workflow, 'workflowId' | 'documentId' | 'steps'>,
  verification: SessionVerification,
  input: { runId: string; number: number; baseUrl: string; startedAt: string },
): WorkflowRun {
  const steps: StepResult[] = workflow.steps.map((step) => {
    const calls = session.calls.filter((c) => c.stepId === step.stepId);
    const status = verification.steps[step.stepId] ?? 'not-run';
    const first = calls[0];
    const issue = calls.find((c) => c.dataPassing.state === 'fail' || c.contract.state === 'fail');
    return {
      stepId: step.stepId,
      status,
      attempts: calls.map((c) => ({ n: c.n, httpStatus: c.httpStatus, ms: 0, when: `call #${c.n}` })),
      request: first ? { method: first.method, url: `${input.baseUrl}${first.path}`, params: {} } : undefined,
      criteria: calls.map((c) => ({
        condition: 'The call matches the step and the contract',
        kind: 'simple' as const,
        evaluation: `${c.method} ${c.path} → ${c.httpStatus}`,
        held: c.dataPassing.state !== 'fail' && c.contract.state !== 'fail',
      })),
      schema: { state: 'off', ref: '', message: 'Contract checked per call in the session.' },
      outputs: {},
      flow:
        status === 'failed'
          ? { kind: 'stop', title: 'Data not taken from an earlier step', text: issue ? `${issue.dataPassing.text}` : 'The call breaks the workflow.' }
          : { kind: 'next', title: status === 'passed' ? 'Next step' : '', text: status === 'passed' ? 'The calls of this step follow the workflow.' : '' },
      baggage: baggage(input.runId, workflow.workflowId, step.stepId, 1),
    };
  });
  return {
    id: input.runId,
    number: input.number,
    documentId: workflow.documentId,
    workflowId: workflow.workflowId,
    origin: { kind: 'session', sessionId: session.id, app: session.app },
    target: { kind: 'mocks' },
    options: { inputs: session.inputs, timeoutMs: 10_000, validateSchemas: false },
    status: verification.result,
    startedAt: input.startedAt,
    steps,
    outputs: {},
    coherence: [],
  };
}
