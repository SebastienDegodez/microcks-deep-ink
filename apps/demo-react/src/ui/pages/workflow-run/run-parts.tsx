import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { ApiBadge, CodeBlock, CopyButton, Icon } from '@microcks/deep-ink';
import './workflow-run.css';

/* Pieces shared by the run setup page and the run page (the prototype is one page in two phases). */

/** Breadcrumb of both pages: Workflows › Pastry workflows - 1.2.0 › Runs › <current>. */
export function runBreadcrumb(documentLabel: string | undefined, workflowTo: string, runsTo: string, current: string) {
  return [
    { label: 'Workflows', to: '/workflows' },
    { label: documentLabel ?? 'Workflow', to: workflowTo },
    { label: 'Runs', to: runsTo },
    { label: current },
  ];
}

/** ARAZZO link badge of the workflow ("restock-pastry Pastry workflows 1.2.0") and the result or status chip. */
export function RunBadges({ workflowId, documentLabel, to, chip }: { workflowId: string; documentLabel?: string; to: string; chip?: ReactNode }) {
  return (
    <span className="wfr-badges">
      <RouterLink to={to} className="wfr-badge-link">
        <ApiBadge arazzo name={workflowId} version={documentLabel} />
      </RouterLink>
      {chip}
    </span>
  );
}

/** "apiPastry → https://pastry.staging.acme.io/v2" for the implementations of a run or a form. */
export function implementationsText(baseUrls: Record<string, string>): string {
  return Object.entries(baseUrls)
    .map(([source, url]) => `${source} → ${url}`)
    .join(' · ');
}

/** Body of `POST …/runs` as the POC API takes it. */
export interface RunApiBody {
  inputs: Record<string, unknown>;
  timeout: number;
  implementations?: Record<string, string>;
  secretName?: string;
  validateSchema: boolean;
  example?: string;
}

/**
 * "Run it from the API": the curl that launches the same run, then the Mock URL curl that plays the workflow on its
 * mocks. Both commands are pretty-printed, with a "Copy command" button.
 */
export function RunApiPanel({
  hint,
  documentApiId,
  documentLabel,
  workflowId,
  mockUrl,
  body,
  mixed,
}: {
  hint: string;
  documentApiId: string;
  documentLabel: string;
  workflowId: string;
  mockUrl: string;
  body: RunApiBody;
  mixed?: boolean;
}) {
  const runsUrl = `http://microcks.local:8080/api/arazzo/documents/${documentApiId}/workflows/${workflowId}/runs`;
  const curl = `curl -X POST \\\n  '${runsUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body, null, 2)}'`;
  const curlOne = `curl -X POST '${runsUrl}' -H 'Content-Type: application/json' -d '${JSON.stringify(body)}'`;
  const mockBody = JSON.stringify(body.inputs);
  const mockCurl = `curl -X POST \\\n  '${mockUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${mockBody}'`;
  const mockOne = `curl -X POST '${mockUrl}' -H 'Content-Type: application/json' -d '${mockBody}'`;
  return (
    <section aria-labelledby="run-api-h" className="wfr-card wfr-api">
      <h2 id="run-api-h" className="wfr-card-title">
        Run it from the API
      </h2>
      <p className="wfr-note">{hint}</p>
      <CodeBlock className="wfr-pre" variant="plain" copy={false} language="bash" caption="curl command that launches the run" code={curl} />
      <div className="wfr-api-foot">
        <p className="wfr-note">
          Answers 201 with the run; read it at <span className="wfr-mono">GET /api/arazzo/runs/{'{id}'}</span>. {documentApiId.slice(0, 8)}… is the documentId of {documentLabel}.
        </p>
        <CopyButton value={curlOne} label="Copy command" variant="outline" className="wfr-copy" />
      </div>
      {mixed ? (
        <p className="wfr-note" data-tone="warning">
          Proposed · beyond POC: a source left out of <span className="wfr-mono">implementations</span> stays on its mocks.
        </p>
      ) : null}
      <div className="wfr-api-mock">
        <h3 className="wfr-card-subtitle">Or play it on the mocks through its Mock URL</h3>
        <p className="wfr-note">
          Microcks plays {workflowId} on its mocks and answers 200 with the workflow outputs. Each call creates a run with origin Mock URL.
        </p>
        <CodeBlock className="wfr-pre" data-size="sm" variant="plain" copy={false} language="bash" caption="curl command for the Mock URL" code={mockCurl} />
        <CopyButton value={mockOne} label="Copy command" variant="outline" className="wfr-copy" />
      </div>
    </section>
  );
}

/** Small status glyph + word, never colour only: "✓ Passed", "✕ Failed", "– Off". */
export function Verdict({ tone, icon, children, size = 12 }: { tone: 'success' | 'danger' | 'muted' | 'warning' | 'running'; icon: 'check' | 'cross' | 'dash' | 'running' | 'circle'; children: ReactNode; size?: number }) {
  return (
    <span className="wfr-verdict" data-tone={tone}>
      <Icon name={icon} size={size} strokeWidth={icon === 'circle' ? 2 : 2.6} strokeDasharray={icon === 'circle' ? '3 3' : undefined} />
      {children}
    </span>
  );
}
