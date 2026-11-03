import './workflows.css';
import { Link as RouterLink } from 'react-router';
import type { ReactNode } from 'react';
import type { RunOrigin as RunOriginModel, RunTarget as RunTargetModel, StepStatus, WorkflowRun } from '@/domain/arazzo';
import { stepStripAlt } from '@/domain/arazzo';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Icon } from '@/ui/components/ui/icon';
import { RunOrigin } from '@/ui/components/ui/run-origin';
import { RunTarget } from '@/ui/components/ui/run-target';
import { Skeleton } from '@/ui/components/ui/skeleton';

/* ------------------------------------------------------------------------------------------ routes */

export type WorkflowTab = 'loom' | 'steps' | 'source' | 'mock-url' | 'sessions' | 'examples' | 'runs';

export const WORKFLOW_TABS: readonly WorkflowTab[] = ['loom', 'steps', 'source', 'mock-url', 'sessions', 'examples', 'runs'];

export function isWorkflowTab(value: string | undefined): value is WorkflowTab {
  return WORKFLOW_TABS.includes(value as WorkflowTab);
}

export function workflowPath(documentId: string, workflowId: string, tab?: WorkflowTab, query?: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) if (value) params.set(key, value);
  const search = params.toString();
  return `/workflows/${documentId}/${workflowId}${tab ? `/${tab}` : ''}${search ? `?${search}` : ''}`;
}

export const runSetupPath = (documentId: string, workflowId: string, scenario?: string) =>
  `/workflows/${documentId}/${workflowId}/run${scenario ? `?scenario=${scenario}` : ''}`;

export const runPath = (runId: string, live = false) => `/workflows/runs/${runId}${live ? '?live' : ''}`;

/* ---------------------------------------------------------------------------------------- run facts */

export function targetKind(target: RunTargetModel): 'mocks' | 'implementations' | 'mixed' {
  return target.kind;
}

/** The target of a run as a component: "Mocks", "Implementations", "Mixed" + the proposed chip. */
export function RunTargetOf({ run }: { run: Pick<WorkflowRun, 'target'> }) {
  return <RunTarget target={targetKind(run.target)} />;
}

/** The origin of a run as a component: "UI", "API", "Mock URL", "Session s-7f3a2c91". */
export function RunOriginOf({ origin }: { origin: RunOriginModel }) {
  return origin.kind === 'session' ? <RunOrigin origin="session" sessionId={origin.sessionId} /> : <RunOrigin origin={origin.kind} />;
}

/** Short word for a target, used in sentences. */
export function targetWord(target: RunTargetModel): string {
  return target.kind === 'mocks' ? 'Microcks mocks' : target.kind === 'implementations' ? 'Implementations' : 'Mixed targets';
}

/** "Example restock-eclair" style one-liner used in lists. */
export function runInputsText(run: Pick<WorkflowRun, 'options'>): string {
  const entries = Object.entries(run.options.inputs);
  return entries.length ? entries.map(([k, v]) => `${k}=${String(v)}`).join(' ') : 'no input';
}

/* ------------------------------------------------------------------------------------- step strip */

const GLYPH: Record<StepStatus, string> = { passed: '✓', failed: '✕', 'not-run': '–' };

/**
 * Mini strip of the steps of a run: one cell per step with a glyph, so the status is never color only.
 * The whole strip is one image with a text alternative ("4 steps: passed, passed, failed, not run").
 */
export function StepStrip({ statuses, count, never }: { statuses?: readonly StepStatus[]; count: number; never?: boolean }) {
  const list = statuses ?? Array.from({ length: count }, () => 'not-run' as const);
  const alt = never ? `${count} ${count === 1 ? 'step' : 'steps'}, never run` : stepStripAlt(list);
  return (
    <span role="img" aria-label={alt} className="wf-strip" data-never={never ? '' : undefined}>
      {list.map((status, i) => (
        <span key={i} className="wf-strip-cell" data-status={never ? 'never' : status} aria-hidden="true">
          {never ? '' : GLYPH[status]}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------------------- states and layout */

/** Loading state: skeleton rows inside a busy region, with a text for assistive technology. */
export function LoadingBlock({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" className="wf-loading">
      <p className="sr-only" role="status">
        {label}
      </p>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} lines={2} />
      ))}
    </div>
  );
}

/** Error state with a retry button. */
export function ErrorBlock({ error, onRetry, title = 'Something went wrong' }: { error: Error; onRetry?: () => void; title?: string }) {
  return (
    <Callout
      tone="danger"
      title={title}
      live="assertive"
      actions={onRetry ? <Button size="sm" icon="retry" onClick={onRetry}>Try again</Button> : undefined}
    >
      {error.message}
    </Callout>
  );
}

/** Router link styled like a link. */
export function PageLink({ to, children, ...rest }: { to: string; children: ReactNode; 'aria-label'?: string; title?: string }) {
  return (
    <RouterLink to={to} className="link" {...rest}>
      {children}
    </RouterLink>
  );
}

/** Router link styled like a button (primary actions are 44px high). */
export function ButtonRouterLink({
  to,
  children,
  variant = 'secondary',
  size = 'md',
  icon,
}: {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  icon?: Parameters<typeof Button>[0]['icon'];
}) {
  return (
    <Button asChild variant={variant} size={size} icon={icon}>
      <RouterLink to={to}>{children}</RouterLink>
    </Button>
  );
}

/** Icon + text "result" word used for Passed / Failed / Never run (never color only). */
export function ResultWord({ result }: { result: 'passed' | 'failed' | 'never' | 'running' }) {
  const map = {
    passed: { icon: 'check', word: 'Passed' },
    failed: { icon: 'cross', word: 'Failed' },
    never: { icon: 'circle', word: 'Never run' },
    running: { icon: 'running', word: 'Running' },
  } as const;
  const { icon, word } = map[result];
  return (
    <span className="wf-result" data-result={result}>
      <Icon name={icon} size={14} />
      {word}
    </span>
  );
}
