import { runHeadline, runOutcome, stoppedStep, type RunKindFilter, type Workflow, type WorkflowRun } from '../../domain/arazzo/index.js';

/** Result filters, in display order. */
export const RESULTS = [
  { id: 'all', label: 'All', dot: 'neutral' },
  { id: 'passed', label: 'Passed', dot: 'success' },
  { id: 'failed', label: 'Failed', dot: 'danger' },
  { id: 'never', label: 'Never run', dot: 'ring' },
] as const;

/** Selected last-run result filter. */
export type Result = (typeof RESULTS)[number]['id'];

/** Labels of the run targets and call origins. */
export const TARGET_LABEL: Record<Exclude<RunKindFilter, 'any'>, string> = {
  mocks: 'Microcks mocks',
  implementations: 'Implementations',
  'mock-url': 'Mock URL',
  session: 'Session',
};

/** Target filters, in display order. */
export const TARGETS = [
  { id: 'any', label: 'Any target' },
  { id: 'mocks', label: TARGET_LABEL.mocks, icon: 'plus-square' },
  { id: 'implementations', label: TARGET_LABEL.implementations, icon: 'server' },
  { id: 'mock-url', label: TARGET_LABEL['mock-url'] },
  { id: 'session', label: TARGET_LABEL.session },
] as const;

/** Result labels used in the active-filter description. */
export const RESULT_LABEL: Record<Exclude<Result, 'all'>, string> = { passed: 'Passed', failed: 'Failed', never: 'Never run' };

/** The origin first (Session, Mock URL), then the target. */
export function targetLabel(run: WorkflowRun): string {
  if (run.origin.kind === 'session') return TARGET_LABEL.session;
  if (run.origin.kind === 'mock-url') return TARGET_LABEL['mock-url'];
  return run.target.kind === 'mocks' ? TARGET_LABEL.mocks : run.target.kind === 'implementations' ? TARGET_LABEL.implementations : 'Mixed targets';
}

/** One line on the last run: where it stopped, or how it passed. */
export function runNote(run: WorkflowRun): string {
  if (runOutcome(run) === 'failed') {
    const stopped = stoppedStep(run);
    if (run.origin.kind === 'session' && stopped) {
      const why = stopped.flow.title;
      return `Session ${run.origin.sessionId} · ${stopped.stepId}: ${why.charAt(0).toLowerCase()}${why.slice(1)}`;
    }
    return runHeadline(run).detail;
  }
  if (run.origin.kind === 'mock-url') return 'Called through its Mock URL';
  if (run.options.example) return `Example ${run.options.example} · Matches the example`;
  return '';
}

/** Whether a workflow uses a source description. */
export const usesSource = (workflow: Workflow, name: string) => workflow.steps.some((s) => s.sourceName === name);

/** Minimal document shown by the empty-install walkthrough. */
export const SAMPLE_YAML = `arazzo: 1.1.0
info:
  title: Pastry workflows
  version: 1.2.0
sourceDescriptions:
  - name: apiPastry
    url: ./apipastry-2.0-openapi.yaml
    type: openapi
workflows:
  - workflowId: restock-pastry
    steps:
      - stepId: listPastries
        operationId: GetPastries
        successCriteria:
          - condition: $statusCode == 200
        outputs:
          firstName: $response.body#/0/name`;

/** Steps of the empty-install walkthrough. */
export const ONBOARDING = [
  { title: 'Import an Arazzo document', text: 'Upload a file or import it from a URL in Importers. Link each source description to a Microcks API, in the dialog or with an ArazzoSources overlay.' },
  { title: 'Play it on the mocks', text: 'Run it on the Microcks mocks, call its Mock URL, or open a verification session for the application under test.' },
  { title: 'Run it on your implementations', text: 'Give a base URL per source; each step is checked on its successCriteria and, optionally, against its OpenAPI schema.' },
];

/** Dimensions of the four loading-placeholder rows. */
export const SKELETONS = [0, 1, 2, 3].map((i) => ({ opacity: 1 - i * 0.18, w1: `${62 + ((i * 13) % 30)}%`, w2: `${180 + ((i * 47) % 120)}px` }));
