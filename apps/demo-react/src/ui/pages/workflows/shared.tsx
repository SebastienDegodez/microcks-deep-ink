import './workflows.css';
import { Link as RouterLink } from 'react-router';
import type { ReactNode } from 'react';
import type { RunOrigin as RunOriginModel, RunTarget as RunTargetModel, WorkflowRun } from '@/domain/arazzo';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { RunOrigin } from '@/ui/components/ui/run-origin';
import { RunTarget } from '@/ui/components/ui/run-target';

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

/* ------------------------------------------------------------------------------- states and layout */

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
