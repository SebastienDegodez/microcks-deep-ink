import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { ApiBadge, CodeBlock, CopyButton, Icon } from '@microcks/deep-ink';
import { runApiCommands, verdictStroke, type RunApiBody, type VerdictIcon } from './api';
import '@microcks/demo-styles/pages/workflow-run/workflow-run.css';

/* Pieces shared by the run setup page and the run page (the prototype is one page in two phases). */

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
  const { curl, curlOne, mockCurl, mockOne } = runApiCommands(documentApiId, workflowId, mockUrl, body);
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
export function Verdict({ tone, icon, children, size = 12 }: { tone: 'success' | 'danger' | 'muted' | 'warning' | 'running'; icon: VerdictIcon; children: ReactNode; size?: number }) {
  const stroke = verdictStroke(icon);
  return (
    <span className="wfr-verdict" data-tone={tone}>
      <Icon name={icon} size={size} strokeWidth={stroke.width} strokeDasharray={stroke.dash} />
      {children}
    </span>
  );
}
