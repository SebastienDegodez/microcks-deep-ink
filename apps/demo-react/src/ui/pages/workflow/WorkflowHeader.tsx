import type { ReactNode } from 'react';
import { Link, useHref, useNavigate } from 'react-router';
import { stoppedStep, verdictExplanation, type ArazzoDocument, type Workflow, type WorkflowRun } from '@/domain/arazzo';
import { PageHeader, useClock, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { Menu } from '@/ui/components/ui/menu';
import { runPath, runSetupPath, workflowPath } from '../workflows/shared';

const WEEK = 7 * 24 * 3600_000;

export interface WorkflowHeaderProps {
  document: ArazzoDocument;
  workflow: Workflow;
  runs: WorkflowRun[];
  /** Service names of the linked sources, by service id ("pastry2" → "API Pastry 2.0"). */
  serviceLabel: (serviceId: string) => string | undefined;
  onMockUrl: () => void;
}

/** "Synced 12 min ago" from the document origin "Synced 12 min ago from GitHub". */
export function syncedText(document: Pick<ArazzoDocument, 'origin'>): string | undefined {
  return document.origin.startsWith('Synced') ? document.origin.replace(/ from .*$/, '') : undefined;
}

function download(file: string, text: string) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/yaml' }));
    const a = window.document.createElement('a');
    a.href = url;
    a.download = file;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* jsdom or a blocked download: nothing to do. */
  }
}

/** Header of the Workflow page: breadcrumb, ARAZZO title badge, facts, description, proof strip and actions. */
export function WorkflowHeader({ document, workflow, runs, serviceLabel, onMockUrl }: WorkflowHeaderProps) {
  const uc = useUseCases();
  const clock = useClock();
  const sourcesHref = useHref('/sources');
  const importHref = useHref('/import');
  const canRun = workflow.runnability.runnable;
  const lastRun = runs[0];
  const used = [...new Set(workflow.steps.map((s) => s.sourceName))];
  const synced = syncedText(document);
  const now = clock.now().getTime();
  const week = runs.filter((r) => r.status !== 'RUNNING' && now - new Date(r.startedAt).getTime() < WEEK);
  const passed = week.filter((r) => r.status === 'SUCCESS').length;
  const lastWord = lastRun ? (lastRun.status === 'SUCCESS' ? 'passed' : lastRun.status === 'FAILURE' ? 'failed' : 'running') : undefined;
  const lastHow = lastRun ? runHow(lastRun) : '';

  return (
    <PageHeader
      variant="badge"
      align="start"
      breadcrumbSeparator="chevron"
      breadcrumb={[
        { label: 'Workflows', to: '/workflows' },
        { label: `${document.title} ${document.version}`, to: '/workflows' },
        { label: workflow.summary },
      ]}
      title={<ApiBadge arazzo name={workflow.summary} version={document.version} size="xl" />}
      actions={
        <>
          {canRun ? (
            <Button asChild variant="primary" icon="play">
              <Link to={runSetupPath(document.id, workflow.workflowId)}>Run workflow</Link>
            </Button>
          ) : (
            <Button variant="primary" icon="play" disabled aria-describedby="wf-run-why">
              Run workflow
            </Button>
          )}
          <Button asChild icon="pencil">
            <Link to="/sources">Edit in source</Link>
          </Button>
          <Menu
            label="More workflow actions"
            iconOnly
            icon="more-vertical"
            align="end"
            items={[
              { id: 'copy', label: 'Copy workflowId', onSelect: () => void navigator.clipboard?.writeText(workflow.workflowId).catch(() => undefined) },
              { id: 'download', label: 'Download Arazzo document', onSelect: () => void uc.arazzo.getDocumentSource(document.id).then((y) => download(document.file, y)) },
              ...(document.overlay
                ? [{ id: 'overlay', label: 'Download ArazzoSources overlay', onSelect: () => void uc.arazzo.getDocumentOverlay(document.id).then((y) => y && download(document.overlay ?? 'overlay.yaml', y)) }]
                : []),
              { id: 'job', label: `Open source job ${document.title}`, href: sourcesHref },
              { id: 'reimport', label: 'Re-import the Arazzo document', href: importHref },
              { id: 'delete', label: 'Delete workflow', disabled: true, separatorBefore: true, description: 'Workflows are removed with their Arazzo document.' },
            ]}
          />
        </>
      }
    >
      <div className="wf-facts">
        <span>
          workflowId <span className="wf-facts-strong">{workflow.workflowId}</span>
        </span>
        <span className="demo-mono">
          {document.file} · arazzo {document.arazzoVersion}
        </span>
        {document.overlay ? (
          <span>
            overlay <span className="demo-mono">{document.overlay}</span>
          </span>
        ) : null}
        {synced ? (
          <span>
            {synced} by source job <Link to="/sources">{document.title}</Link>
          </span>
        ) : (
          <span>{document.origin}</span>
        )}
      </div>
      <p className="wf-description">{workflow.description ?? workflow.summary}</p>
      <div className="wf-proof">
        {used.map((name) => {
          const src = document.sources.find((s) => s.name === name);
          const link = src?.link.status === 'linked' ? src.link : undefined;
          const label = link ? serviceLabel(link.serviceId) : undefined;
          return (
            <span key={name} className="wf-proof-source">
              <span className="wf-proof-name">{name}</span>
              {link && label ? (
                <Link to={`/services/${link.serviceId}`} className="wf-badge-link" aria-label={`Source description ${name}, linked to ${link.protocol} ${label}`}>
                  <ApiBadge protocol={link.protocol} name={label} />
                </Link>
              ) : (
                <ApiBadge label="not linked" value={name} status="warning" />
              )}
            </span>
          );
        })}
        <span aria-hidden="true" className="wf-proof-divider" />
        {lastRun && lastWord ? (
          <Link to={runPath(lastRun.id)} className="wf-badge-link">
            <ApiBadge
              label="last run"
              value={`${lastWord} #${lastRun.number}`}
              status={lastRun.status === 'SUCCESS' ? 'success' : lastRun.status === 'FAILURE' ? 'danger' : 'info'}
              values={[{ value: lastHow }]}
            />
          </Link>
        ) : null}
        {week.length ? <ApiBadge label="runs · 7 d" value={`${passed}/${week.length} passed`} /> : null}
        <button type="button" className="wf-badge-button" onClick={onMockUrl} aria-label="Mock URL ready: open the Mock URL tab">
          <ApiBadge label="mock url" value="ready" status="success" />
        </button>
      </div>
    </PageHeader>
  );
}

/** "Implementations · schema validation", "Microcks mocks", "Mock URL", "Session". */
export function runHow(run: WorkflowRun): string {
  if (run.origin.kind === 'session') return 'Session';
  if (run.origin.kind === 'mock-url') return 'Mock URL';
  if (run.target.kind === 'implementations') return `Implementations${run.options.validateSchemas ? ' · schema validation' : ''}`;
  return run.target.kind === 'mixed' ? 'Mixed' : 'Microcks mocks';
}

/** Why the last run failed, in one or two sentences (the note under the header). */
function failureText(run: WorkflowRun, workflow: Workflow): ReactNode {
  const stopped = stoppedStep(run);
  if (!stopped) return verdictExplanation(run);
  const notRun = run.steps.filter((s) => s.status === 'not-run').map((s) => s.stepId);
  const tail = [
    stopped.attempts.length > 1 ? 'The retry did not help' : undefined,
    notRun.length ? `${notRun.join(' and ')} ${notRun.length === 1 ? 'was' : 'were'} not run` : undefined,
    Object.keys(run.outputs).length === 0 ? 'the workflow produced no outputs' : undefined,
  ].filter(Boolean);
  const end = tail.length ? ` ${(tail as string[]).join(', ').replace(/, ([^,]*)$/, ' and $1')}.` : '';
  const bad = stopped.response?.lines.find((l) => l.bad);
  const field = bad ? /"([^"]+)":\s*(.+?),?$/.exec(bad.text.trim()) : null;
  if (stopped.schema.state === 'fail' && stopped.criteria.every((c) => c.held)) {
    const base = run.target.kind === 'implementations' ? Object.values(run.target.baseUrls)[0] : undefined;
    const who = base?.includes('staging') ? 'staging' : run.target.kind === 'implementations' ? 'the implementation' : 'the mock';
    const expected = bad?.note?.replace(/^schema:\s*/, '');
    const step = workflow.steps.find((s) => s.stepId === stopped.stepId);
    return (
      <>
        Its success criteria held (<span className="demo-mono">{stopped.criteria.map((c) => c.condition).join(', ')}</span>), but schema validation failed
        {field && expected ? (
          <>
            : {who} answers <span className="demo-mono">{field[1]}</span> as the string {field[2]} where the {schemaName(stopped.schema.ref) ?? step?.operationId} schema expects a {expected}.
          </>
        ) : (
          <>: {stopped.schema.message}.</>
        )}
        {end}
      </>
    );
  }
  return `${verdictExplanation(run).replace(/ The workflow stopped there and produced no outputs\.$/, '')}${end}`;
}

/** "PatchPastry · 200 · application/json · Pastry" → "Pastry". */
function schemaName(ref: string): string | undefined {
  const parts = ref.split(' · ');
  return parts.length > 3 ? parts[parts.length - 1] : undefined;
}

/** One-line note on the last run when it failed: what failed, why, and the ways to look closer. */
export function LastRunNote({ document, workflow, run }: { document: ArazzoDocument; workflow: Workflow; run: WorkflowRun }) {
  const navigate = useNavigate();
  const stopped = stoppedStep(run);
  if (run.status !== 'FAILURE' || !stopped) return null;
  const index = workflow.steps.findIndex((s) => s.stepId === stopped.stepId) + 1;
  const attempts = stopped.attempts.length;
  return (
    <div role="note" className="wf-last-note">
      <span className="wf-last-note-title">
        <Icon name="x-circle" size={16} />
        Run #{run.number} · step {index}, {stopped.stepId}, failed{attempts > 1 ? ` after ${attempts} attempts` : ''}
      </span>
      <span className="wf-last-note-text">{failureText(run, workflow)}</span>
      <span className="wf-last-note-actions">
        <Button size="sm" onClick={() => navigate(workflowPath(document.id, workflow.workflowId, 'loom', { run: String(run.number), step: stopped.stepId }))}>
          Inspect step {index}
        </Button>
        <Link to={runPath(run.id)} className="wf-note-link">
          Open run #{run.number}
        </Link>
      </span>
    </div>
  );
}
