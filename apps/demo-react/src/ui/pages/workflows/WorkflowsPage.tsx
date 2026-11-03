import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArazzoDocument, RunKindFilter, SourceDescription } from '@/domain/arazzo';
import { runHeadline, runOutcome } from '@/domain/arazzo';
import type { WorkflowListItem } from '@/application/arazzo';
import { PageHeader, useAnnounce, usePageTitle, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { Segmented } from '@/ui/components/ui/segmented';
import { DataTable, type DataTableColumn } from '@/ui/components/ui/table';
import { LinkSourceDialog } from './LinkSourceDialog';
import {
  ButtonRouterLink,
  ErrorBlock,
  LoadingBlock,
  PageLink,
  ResultWord,
  RunOriginOf,
  RunTargetOf,
  StepStrip,
  runPath,
  runSetupPath,
  workflowPath,
} from './shared';

type Result = 'all' | 'passed' | 'failed' | 'never';

const RESULTS: { id: Result; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
  { id: 'never', label: 'Never run' },
];

const TARGETS: { id: RunKindFilter; label: string }[] = [
  { id: 'any', label: 'Any target' },
  { id: 'mocks', label: 'Microcks mocks' },
  { id: 'implementations', label: 'Implementations' },
  { id: 'mock-url', label: 'Mock URL' },
  { id: 'session', label: 'Session' },
];

const SAMPLE_YAML = `arazzo: 1.1.0
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

const ONBOARDING = [
  { title: 'Import an Arazzo document', text: 'Upload a file or import it from a URL in Importers. Link each source description to a Microcks API, in the dialog or with an ArazzoSources overlay.' },
  { title: 'Play it on the mocks', text: 'Run it on the Microcks mocks, call its Mock URL, or open a verification session for the application under test.' },
  { title: 'Run it on your implementations', text: 'Give a base URL per source; each step is checked on its successCriteria and, optionally, against its OpenAPI schema.' },
];

function Onboarding() {
  return (
    <section aria-labelledby="wf-onb-title" className="wf-grid-2">
      <div className="wf-section">
        <div className="wf-row">
          <ApiBadge arazzo name="no workflow yet" />
        </div>
        <h2 id="wf-onb-title">Bring your API workflows into Microcks</h2>
        <p className="wf-lead">
          Arazzo is the OpenAPI Initiative specification for describing multi-step API workflows, where the output of one call feeds the next. Import an
          Arazzo document and link each of its source descriptions to an API already in Microcks: the whole journey can then be played on the mocks and
          run end to end against your implementations.
        </p>
        <ol className="wf-plain-list">
          {ONBOARDING.map((s) => (
            <li key={s.title}>
              <strong>{s.title}.</strong> {s.text}
            </li>
          ))}
        </ol>
        <div className="wf-row">
          <ButtonRouterLink to="/sources/new" variant="primary" icon="upload">
            Import Arazzo document
          </ButtonRouterLink>
          <ButtonRouterLink to="/sources">Sync from a Git repository</ButtonRouterLink>
        </div>
      </div>
      <CodeBlock caption="A minimal Arazzo document" language="yaml" code={SAMPLE_YAML} />
    </section>
  );
}

interface LinkTarget {
  document: ArazzoDocument;
  source: SourceDescription;
}

export default function WorkflowsPage() {
  usePageTitle('Workflows · Microcks');
  const uc = useUseCases();
  const announce = useAnnounce();
  const relative = useRelativeTime();

  const [q, setQ] = useState('');
  const [result, setResult] = useState<Result>('all');
  const [runKind, setRunKind] = useState<RunKindFilter>('any');
  const [sources, setSources] = useState<string[]>([]);
  const [demo, setDemo] = useState<'loading' | 'empty' | null>(null);
  const [linking, setLinking] = useState<LinkTarget | null>(null);
  const [linked, setLinked] = useState<string | null>(null);

  const docs = useQuery(() => uc.arazzo.listDocuments(), [linked]);
  const services = useQuery(() => uc.catalog.listServices(), []);
  const sourcesKey = sources.join(',');
  const list = useQuery(async () => {
    const base = { query: q, sources, runKind };
    const [all, passed, failed, never] = await Promise.all(RESULTS.map((r) => uc.arazzo.listWorkflows({ ...base, result: r.id })));
    return { all: all ?? [], passed: passed ?? [], failed: failed ?? [], never: never ?? [] };
  }, [q, sourcesKey, runKind, linked]);

  const items: WorkflowListItem[] = list.data?.[result] ?? [];
  const counts = list.data ? { all: list.data.all.length, passed: list.data.passed.length, failed: list.data.failed.length, never: list.data.never.length } : undefined;
  const documents = docs.data ?? [];
  const allSources = documents.flatMap((d) => d.sources);
  const unlinkedTotal = allSources.filter((s) => s.link.status === 'not-linked').length;
  const totalWorkflows = documents.reduce((n, d) => n + d.workflowIds.length, 0);
  const anyFilter = q.trim() !== '' || result !== 'all' || runKind !== 'any' || sources.length > 0;
  const activeCount = [q.trim() !== '', result !== 'all', runKind !== 'any', ...sources.map(() => true)].filter(Boolean).length;

  // Result count in the polite live region, only when the user changed a filter.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      if (list.status === 'success') first.current = false;
      return;
    }
    if (list.status === 'success') announce(`${items.length} of ${totalWorkflows} workflows`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.status, items.length, result]);

  const reset = () => {
    setQ('');
    setResult('all');
    setRunKind('any');
    setSources([]);
  };

  const serviceOf = (id: string) => services.data?.find((s) => s.id === id);
  const sourceChips = useMemo(
    () =>
      allSources.map((s) => ({
        source: s,
        count: documents.flatMap((d) => (d.sources.includes(s) ? d.workflowIds : [])).length,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docs.data],
  );

  const showOnboarding = demo === 'empty' || (docs.status === 'success' && documents.length === 0);
  const loading = demo === 'loading' || ((docs.status === 'loading' || list.status === 'loading') && !list.data);
  const targetPhrase = TARGETS.find((t) => t.id === runKind)?.label.toLowerCase() ?? 'any target';

  const groups = documents
    .map((d) => ({ document: d, rows: items.filter((i) => i.document.id === d.id) }))
    .filter((g) => g.rows.length > 0);

  const countLine = showOnboarding
    ? '0 workflows · 0 Arazzo documents'
    : loading
      ? 'Loading…'
      : `${totalWorkflows} workflows · ${documents.length} Arazzo documents · ${allSources.length} source descriptions (${unlinkedTotal} not linked)`;

  return (
    <div className="wf-page">
      <PageHeader
        title="Workflows"
        eyebrow={countLine}
        actions={
          <>
            <ButtonRouterLink to="/sources">Sources</ButtonRouterLink>
            <ButtonRouterLink to="/sources/new" variant="primary" icon="upload">
              Import Arazzo document
            </ButtonRouterLink>
          </>
        }
      />
      <p className="wf-lead">
        Multi-step API journeys described with Arazzo. Each step calls an operation of an API already in Microcks; play them against the mocks or against
        your implementations, or call them through their Mock URL.
      </p>

      {linked ? (
        <Callout tone="success" title={`${linked} linked`} live="polite">
          The workflows that use it can run now.
        </Callout>
      ) : null}

      {docs.status === 'error' || list.status === 'error' ? (
        <ErrorBlock error={(docs.error ?? list.error) as Error} onRetry={() => (docs.status === 'error' ? docs.reload() : list.reload())} title="Workflows could not be loaded" />
      ) : null}

      {loading ? <LoadingBlock label="Loading workflows" rows={4} /> : null}

      {showOnboarding && !loading ? <Onboarding /> : null}

      {!loading && !showOnboarding && docs.status === 'success' ? (
        <>
          <section aria-label="Workflow filters" className="wf-filters">
            <div className="wf-filter-row">
              <Field label="Filter workflows" className="wf-grow">
                {(control) => <Input {...control} type="search" autoComplete="off" value={q} placeholder="Filter by name, workflowId or stepId…" onChange={(e) => setQ(e.target.value)} />}
              </Field>
              <Segmented label="Last run result" options={RESULTS.map((r) => ({ ...r, count: counts?.[r.id] }))} value={result} onChange={(id) => setResult(id as Result)} />
              <Segmented label="Run target" options={TARGETS} value={runKind} onChange={(id) => setRunKind(id as RunKindFilter)} />
            </div>
            <div className="wf-row">
              <span className="wf-small wf-muted" id="wf-src-label">
                Sources
              </span>
              <div role="group" aria-labelledby="wf-src-label" className="wf-row">
                {sourceChips.map(({ source, count }) => {
                  const linkedTo = source.link.status === 'linked' ? serviceOf(source.link.serviceId) : undefined;
                  const unlinked = source.link.status === 'not-linked';
                  return (
                    <Chip
                      key={source.name}
                      pressed={sources.includes(source.name)}
                      tone={unlinked ? 'warning' : 'neutral'}
                      variant={unlinked ? 'dashed' : 'outline'}
                      onClick={() => setSources((cur) => (cur.includes(source.name) ? cur.filter((n) => n !== source.name) : [...cur, source.name]))}
                    >
                      {unlinked ? <Icon name="warning" size={12} /> : null}
                      {unlinked ? `${source.name} · not linked` : linkedTo ? `${linkedTo.name} ${linkedTo.version}` : source.name}
                      <span className="sr-only">, {count} {count === 1 ? 'workflow' : 'workflows'}</span>
                      <span aria-hidden="true"> {count}</span>
                    </Chip>
                  );
                })}
              </div>
              {anyFilter ? (
                <Button size="sm" variant="ghost" icon="undo" onClick={reset}>
                  Reset ({activeCount})
                </Button>
              ) : null}
            </div>
          </section>

          <div className="wf-row-between">
            <p role="status" className="wf-small wf-muted" aria-live="off">
              <strong>{items.length}</strong> of {totalWorkflows} workflows · last run {targetPhrase}
            </p>
            <p className="wf-small wf-muted">Steps: one cell per step (✓ passed, ✕ failed, – not reached), dashed when never run.</p>
          </div>

          {items.length === 0 ? (
            <section aria-labelledby="wf-none" className="wf-section">
              <h2 id="wf-none">No workflow matches these filters</h2>
              <p>Remove a filter or reset the selection.</p>
              <div>
                <Button icon="undo" onClick={reset}>
                  Reset filters
                </Button>
              </div>
            </section>
          ) : (
            groups.map(({ document, rows }) => (
              <DocumentGroup
                key={document.id}
                document={document}
                rows={rows}
                total={document.workflowIds.length}
                serviceName={(id) => {
                  const s = serviceOf(id);
                  return s ? { name: s.name, version: s.version } : undefined;
                }}
                relative={relative}
                onLink={(source) => setLinking({ document, source })}
              />
            ))
          )}

          {linking ? (
            <LinkSourceDialog
              open
              document={linking.document}
              source={linking.source}
              onClose={() => setLinking(null)}
              onLinked={(service) => {
                setLinked(`${linking.source.name} → ${service.name} ${service.version}`);
                setLinking(null);
              }}
            />
          ) : null}
        </>
      ) : null}

      <section aria-label="Prototype states" className="wf-row">
        <span className="wf-small wf-muted">Prototype states</span>
        <Chip pressed={demo === 'loading'} onClick={() => setDemo((d) => (d === 'loading' ? null : 'loading'))}>
          Show loading
        </Chip>
        <Chip pressed={demo === 'empty'} onClick={() => setDemo((d) => (d === 'empty' ? null : 'empty'))}>
          Show empty state
        </Chip>
      </section>
    </div>
  );
}

interface DocumentGroupProps {
  document: ArazzoDocument;
  rows: WorkflowListItem[];
  total: number;
  serviceName: (id: string) => { name: string; version: string } | undefined;
  relative: (date: string) => string;
  onLink: (source: SourceDescription) => void;
}

function DocumentGroup({ document: doc, rows, total, serviceName, relative, onLink }: DocumentGroupProps) {
  const unlinked = doc.sources.filter((s) => s.link.status === 'not-linked');
  const linkedCount = doc.sources.length - unlinked.length;
  const headingId = `wf-doc-${doc.id}`;

  const sourceColumns: DataTableColumn<SourceDescription>[] = [
    {
      key: 'name',
      header: 'Source description',
      render: (s) => (
        <span className="wf-cell-stack">
          <code>{s.name}</code>
          <span className="wf-small wf-muted">{s.type}</span>
        </span>
      ),
    },
    { key: 'url', header: 'Declared URL', mono: true },
    {
      key: 'link',
      header: 'Microcks API',
      render: (s) => {
        if (s.link.status === 'not-linked') {
          return (
            <span className="wf-row">
              <Chip tone="warning" variant="dashed">
                <Icon name="warning" size={12} />
                Not linked
              </Chip>
              <Button size="sm" icon="link-out" onClick={() => onLink(s)} aria-label={`Link a source to ${s.name}`}>
                Link a source
              </Button>
            </span>
          );
        }
        const svc = serviceName(s.link.serviceId);
        return (
          <span className="wf-row">
            <PageLink to={`/services/${s.link.serviceId}`} aria-label={`${s.name} is linked to ${s.link.protocol} ${svc?.name ?? ''} ${svc?.version ?? ''}, open the API`}>
              <ApiBadge protocol={s.link.protocol} name={svc?.name ?? s.link.serviceId} version={svc?.version} size="sm" />
            </PageLink>
            <Chip tone="success" variant="outline">
              <Icon name="check" size={12} />
              Linked
            </Chip>
          </span>
        );
      },
    },
    {
      key: 'ops',
      header: 'Step operations',
      render: (s) => (s.link.status === 'linked' ? s.link.operationsFound : `${doc.workflowIds.length} steps unresolved`),
    },
  ];

  const columns: DataTableColumn<WorkflowListItem>[] = [
    {
      key: 'workflow',
      header: 'Workflow',
      render: ({ workflow, document }) => {
        const blocked = !workflow.runnability.runnable;
        const reason = workflow.runnability.runnable ? undefined : workflow.runnability.reason;
        return (
          <span className="wf-cell-stack wf-cell-wide">
            <span className="wf-row">
              <ApiBadge arazzo size="sm" name="" />
              <PageLink to={workflowPath(document.id, workflow.workflowId)}>
                {workflow.summary} <span className="wf-small wf-muted">{document.version}</span>
              </PageLink>
            </span>
            <span className="wf-row">
              <code>{workflow.workflowId}</code>
              {reason === 'asyncapi-steps' ? <Chip variant="outline">AsyncAPI steps · Arazzo 1.1</Chip> : null}
              {blocked ? (
                <Chip tone="warning" variant="dashed">
                  <Icon name="warning" size={12} />
                  {reason === 'asyncapi-steps' ? 'Cannot run yet: AsyncAPI steps' : 'Not linked'}
                </Chip>
              ) : null}
            </span>
            {!workflow.runnability.runnable ? <span className="wf-reason">{workflow.runnability.message}</span> : null}
          </span>
        );
      },
    },
    {
      key: 'steps',
      header: 'Steps',
      render: ({ workflow, lastRun }) => (
        <span className="wf-cell-stack">
          <StepStrip count={workflow.steps.length} statuses={lastRun?.steps.map((s) => s.status)} never={!lastRun} />
          <span className="wf-small wf-muted">
            {workflow.steps.length} steps{workflow.steps.some((s) => s.dependsOn?.length) ? ' · dependsOn' : ''}
          </span>
        </span>
      ),
    },
    {
      key: 'sources',
      header: 'Sources',
      render: ({ workflow, document }) => {
        const names = [...new Set(workflow.steps.map((s) => s.sourceName))];
        return (
          <span className="wf-cell-stack">
            {names.map((n) => {
              const src = document.sources.find((s) => s.name === n);
              const notLinked = src?.link.status === 'not-linked';
              const svc = src?.link.status === 'linked' ? serviceName(src.link.serviceId) : undefined;
              return (
                <Chip key={n} variant={notLinked ? 'dashed' : 'outline'} tone={notLinked ? 'warning' : 'neutral'}>
                  {notLinked ? <Icon name="warning" size={12} /> : null}
                  {n}
                  <span className="sr-only">{notLinked ? ' (not linked)' : svc ? ` (linked to ${svc.name} ${svc.version})` : ''}</span>
                </Chip>
              );
            })}
          </span>
        );
      },
    },
    {
      key: 'inputs',
      header: 'Inputs',
      render: ({ workflow }) => (
        <span aria-label={workflow.inputs.length ? `${workflow.inputs.length} inputs: ${workflow.inputs.map((i) => i.name).join(', ')}` : 'No input'}>
          {workflow.inputs.length ? workflow.inputs.map((i) => i.name).join(' ') : 'none'}
        </span>
      ),
    },
    {
      key: 'last',
      header: 'Last run',
      render: ({ workflow, lastRun }) => {
        if (!lastRun) {
          return (
            <span className="wf-cell-stack">
              <ResultWord result="never" />
              <span className="wf-small wf-muted">{workflow.runnability.runnable ? 'no run yet' : 'Run disabled'}</span>
            </span>
          );
        }
        const outcome = runOutcome(lastRun);
        const detail = outcome === 'failed' ? runHeadline(lastRun).detail : '';
        return (
          <span className="wf-cell-stack wf-cell-wide">
            <span className="wf-row">
              <ResultWord result={outcome === 'running' ? 'never' : outcome} />
              <RunTargetOf run={lastRun} />
              <RunOriginOf origin={lastRun.origin} />
            </span>
            <PageLink
              to={runPath(lastRun.id)}
              aria-label={`#${lastRun.number} · ${relative(lastRun.startedAt)}, run of ${workflow.workflowId}, ${outcome === 'passed' ? 'Passed' : 'Failed'}`}
            >
              #{lastRun.number} · {relative(lastRun.startedAt)}
            </PageLink>
            {detail ? <span className="wf-small wf-muted">{detail}</span> : null}
          </span>
        );
      },
    },
    {
      key: 'mock',
      header: 'Mock URL',
      render: ({ workflow, document, lastMockUrlRun }) => {
        const ready = workflow.runnability.runnable;
        return (
          <span className="wf-cell-stack">
            <span className="wf-row">
              <Icon name={ready ? 'check' : 'dash'} size={14} />
              {ready ? 'Ready' : 'Not available'}
            </span>
            {ready ? (
              <PageLink to={workflowPath(document.id, workflow.workflowId, 'mock-url')} title={`POST ${workflow.mockUrl}`}>
                <code>POST …/{document.version}/{workflow.workflowId}</code>
              </PageLink>
            ) : null}
            <span className="wf-small wf-muted">
              {!ready
                ? workflow.runnability.reason === 'asyncapi-steps'
                  ? 'AsyncAPI steps cannot be played yet'
                  : 'Link beerCatalog first'
                : lastMockUrlRun
                  ? `Last call ${relative(lastMockUrlRun.startedAt)} (run #${lastMockUrlRun.number})`
                  : 'Never called'}
            </span>
          </span>
        );
      },
    },
    {
      key: 'run',
      header: 'Run',
      render: ({ workflow, document }) =>
        workflow.runnability.runnable ? (
          <ButtonRouterLink to={runSetupPath(document.id, workflow.workflowId)} icon="play">
            Run<span className="sr-only"> {workflow.workflowId}</span>
          </ButtonRouterLink>
        ) : (
          <span className="wf-cell-stack">
            <Button disabled icon="play" title={workflow.runnability.message} aria-describedby={`wf-reason-${workflow.workflowId}`}>
              Run<span className="sr-only"> {workflow.workflowId}</span>
            </Button>
            <span id={`wf-reason-${workflow.workflowId}`} className="wf-reason">
              {workflow.runnability.message}
            </span>
          </span>
        ),
    },
  ];

  return (
    <section aria-labelledby={headingId} className="wf-doc">
      <div className="wf-doc-head">
        <Icon name="sources" size={18} />
        <h2 id={headingId}>{doc.file}</h2>
        <span>{doc.title}</span>
        <Chip variant="outline">arazzo {doc.arazzoVersion}</Chip>
        <Chip variant="outline">version {doc.version}</Chip>
        <span className="wf-small wf-muted">
          {doc.origin}
          {doc.origin.startsWith('Synced') ? (
            <>
              {' via '}
              <PageLink to="/sources">{doc.title}</PageLink>
            </>
          ) : null}
        </span>
      </div>
      <p className="wf-small wf-muted wf-row">
        {doc.overlay ? (
          <>
            <Icon name="link-out" size={14} />
            ArazzoSources overlay <code>{doc.overlay}</code> imported: links the sources, carries the recorded examples.
          </>
        ) : (
          <>
            <Icon name="info" size={14} />
            No ArazzoSources overlay · sources linked in the import dialog
          </>
        )}
        <span className="wf-row">
          <Icon name={unlinked.length ? 'warning' : 'check'} size={14} />
          {linkedCount} of {doc.sources.length} linked
        </span>
      </p>
      <DataTable<SourceDescription>
        caption={`Source descriptions of ${doc.file}`}
        density="compact"
        columns={sourceColumns}
        rows={doc.sources}
        rowKey="name"
      />
      {unlinked.length > 0 ? (
        <Callout tone="warning" title={`checkout-beer cannot run until ${unlinked.map((s) => s.name).join(', ')} ${unlinked.length === 1 ? 'is' : 'are'} linked`}>
          Beer Catalog API 1.0 is not in Microcks yet: import beer-catalog-1.0-openapi.yaml first, or pick the API to link with “Link a source”.
        </Callout>
      ) : null}
      <DataTable<WorkflowListItem>
        caption={`Workflows of ${doc.file} (${rows.length} of ${total})`}
        columns={columns}
        rows={rows}
        rowKey={(r) => r.workflow.workflowId}
      />
    </section>
  );
}
