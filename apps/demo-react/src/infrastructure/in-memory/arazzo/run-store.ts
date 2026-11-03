import type { Session, Workflow, WorkflowRun } from '@/domain/arazzo';

/** The mutable state shared by the runner, the run repository and the sessions (all in memory). */
export interface ArazzoState {
  runs: WorkflowRun[];
  sessions: Session[];
  workflows: Workflow[];
  /** Next run number of a workflow (max of its runs + 1). */
  nextNumber(documentId: string, workflowId: string): number;
  /** Deterministic 24-hex id for the runs created during the session. */
  newRunId(): string;
  newSessionId(): string;
}

export function createArazzoState(init: { runs: WorkflowRun[]; sessions: Session[]; workflows: Workflow[] }): ArazzoState {
  let runCounter = 0;
  let sessionCounter = 0;
  const state: ArazzoState = {
    ...init,
    nextNumber(documentId, workflowId) {
      const numbers = state.runs.filter((r) => r.documentId === documentId && r.workflowId === workflowId).map((r) => r.number);
      return (numbers.length ? Math.max(...numbers) : 0) + 1;
    },
    newRunId() {
      runCounter += 1;
      return `6729b${(0xa40000 + runCounter * 4099).toString(16).padStart(19, '0')}`;
    },
    newSessionId() {
      sessionCounter += 1;
      return `s-${(0x2b91e04d + sessionCounter * 7919).toString(16).slice(-8)}`;
    },
  };
  return state;
}
