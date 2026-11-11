import type { WorkflowRun } from './run.js';

/** Filter of the Workflows screen: "Any target / Mocks / Implementations / Mock URL / Session". */
export type RunKindFilter = 'any' | 'mocks' | 'implementations' | 'mock-url' | 'session';

/**
 * Whether a run belongs to a kind filter. The filter mixes target and origin, as in the prototype:
 * `mock-url` and `session` look at the ORIGIN; `mocks` are runs on the mocks started from the UI or the API.
 */
export function matchesRunKind(run: Pick<WorkflowRun, 'origin' | 'target'>, filter: RunKindFilter): boolean {
  switch (filter) {
    case 'any':
      return true;
    case 'mock-url':
      return run.origin.kind === 'mock-url';
    case 'session':
      return run.origin.kind === 'session';
    case 'mocks':
      return run.target.kind === 'mocks' && (run.origin.kind === 'ui' || run.origin.kind === 'api');
    case 'implementations':
      return run.target.kind === 'implementations';
  }
}
