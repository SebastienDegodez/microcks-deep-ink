/** Detail-page sections. */
export type WorkflowTab = 'loom' | 'steps' | 'source' | 'mock-url' | 'sessions' | 'examples' | 'runs';

/** Detail-page sections, in display order. */
export const WORKFLOW_TABS: readonly WorkflowTab[] = ['loom', 'steps', 'source', 'mock-url', 'sessions', 'examples', 'runs'];

/** Whether a route parameter names a workflow section. */
export function isWorkflowTab(value: string | undefined): value is WorkflowTab {
  return WORKFLOW_TABS.includes(value as WorkflowTab);
}

/** Detail route, with optional section and selected run or step. */
export function workflowPath(documentId: string, workflowId: string, tab?: WorkflowTab, query?: Record<string, string | undefined>): string {
  // WHATWG APIs exist in both hosts, but are not declared by the ES2022-only core build.
  const { URLSearchParams } = globalThis as typeof globalThis & {
    URLSearchParams: new () => { set(key: string, value: string): void; toString(): string };
  };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) if (value) params.set(key, value);
  const search = params.toString();
  return `/workflows/${documentId}/${workflowId}${tab ? `/${tab}` : ''}${search ? `?${search}` : ''}`;
}

/** Run form route, with an optional prototype preset. */
export const runSetupPath = (documentId: string, workflowId: string, scenario?: string) =>
  `/workflows/${documentId}/${workflowId}/run${scenario ? `?scenario=${scenario}` : ''}`;

/** Run detail route, optionally following live execution. */
export const runPath = (runId: string, live = false) => `/workflows/runs/${runId}${live ? '?live' : ''}`;
