import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import type { ArazzoDocument, RunKindFilter, SourceDescription, WorkflowRun } from '@/domain/arazzo';
import { runHeadline, runOutcome, stoppedStep } from '@/domain/arazzo';
import type { WorkflowListItem } from '@/application/arazzo';
import { PageHeader, useAnnounce, usePageTitle, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { FilterBar, FilterReset, FilterRow, FilterSearch } from '@/ui/components/ui/filter-bar';
import { Icon } from '@/ui/components/ui/icon';
import { Segmented, type SegmentedOption } from '@/ui/components/ui/segmented';
import { LinkSourceDialog } from './LinkSourceDialog';
import { LoomThumb, sourceColor } from './LoomThumb';
import { ErrorBlock } from '@/ui/app/states';
import { ButtonRouterLink, runPath, runSetupPath, workflowPath } from './shared';

type Result = 'all' | 'passed' | 'failed' | 'never';

const RESULTS: (SegmentedOption & { id: Result })[] = [
  { id: 'all', label: 'All', dot: 'neutral' },
  { id: 'passed', label: 'Passed', dot: 'success' },
  { id: 'failed', label: 'Failed', dot: 'danger' },
  { id: 'never', label: 'Never run', dot: 'ring' },
];

const TARGET_LABEL: Record<Exclude<RunKindFilter, 'any'>, string> = {
  mocks: 'Microcks mocks',
  implementations: 'Implementations',
  'mock-url': 'Mock URL',
  session: 'Session',
};

const TARGETS: (SegmentedOption & { id: RunKindFilter })[] = [
  { id: 'any', label: 'Any target' },
  { id: 'mocks', label: TARGET_LABEL.mocks, icon: 'plus-square' },
  { id: 'implementations', label: TARGET_LABEL.implementations, icon: 'server' },
  { id: 'mock-url', label: TARGET_LABEL['mock-url'] },
  { id: 'session', label: TARGET_LABEL.session },
];

const RESULT_LABEL: Record<Exclude<Result, 'all'>, string> = { passed: 'Passed', failed: 'Failed', never: 'Never run' };

/** The run target as the prototype tags it: the origin first (Session, Mock URL), then the target. */
function targetLabel(run: WorkflowRun): string {
  if (run.origin.kind === 'session') return TARGET_LABEL.session;
  if (run.origin.kind === 'mock-url') return TARGET_LABEL['mock-url'];
  return run.target.kind === 'mocks' ? TARGET_LABEL.mocks : run.target.kind === 'implementations' ? TARGET_LABEL.implementations : 'Mixed targets';
}

/** One line on the last run: where it stopped, or how it passed. */
function runNote(run: WorkflowRun): string {
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
    <section aria-labelledby="wf-onb-title" className="wf-onb">
      <div className="wf-onb-main">
        <div className="wf-onb-head">
          <ApiBadge arazzo name="no workflow yet" className="wf-onb-badge" />
          <h2 id="wf-onb-title">Bring your API workflows into Microcks</h2>
          <p className="wf-onb-lead">
            Arazzo is the OpenAPI Initiative specification for describing multi-step API workflows, where the output of one call feeds the next. Import an
            Arazzo document and link each of its source descriptions to an API already in Microcks: the whole journey can then be played on the mocks and
            run end to end against your implementations.
          </p>
        </div>
        <ol className="wf-onb-steps">
          {ONBOARDING.map((s, i) => (
            <li key={s.title}>
              <span aria-hidden="true" className="wf-onb-n">
                {i + 1}
              </span>
              <span className="wf-onb-text">
                <span className="wf-onb-title">{s.title}</span>
                <span className="wf-onb-desc">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="wf-row">
          <ButtonRouterLink to="/sources/new" variant="primary" icon="download">
            Import Arazzo document
          </ButtonRouterLink>
          <ButtonRouterLink to="/sources">Sync from a Git repository</ButtonRouterLink>
        </div>
      </div>
      <figure className="wf-onb-figure">
        <figcaption>A minimal Arazzo document</figcaption>
        <pre>{SAMPLE_YAML}</pre>
      </figure>
    </section>
  );
}

const SKELETONS = [0, 1, 2, 3].map((i) => ({ opacity: 1 - i * 0.18, w1: `${62 + ((i * 13) % 30)}%`, w2: `${180 + ((i * 47) % 120)}px` }));

/** Loading state: a skeleton shaped like a document group. */
function LoadingGroup() {
  return (
    <section aria-busy="true" aria-label="Loading workflows" className="wf-doc wf-skel">
      <span className="sr-only" role="status">
        Loading workflows…
      </span>
      <div aria-hidden="true" className="wf-skel-head">
        <div className="wf-skel-line">
          <span className="wf-skel-bar" data-fill="raised" style={{ width: 240, maxWidth: '60%', height: 14 }} />
          <span className="wf-skel-bar" style={{ width: 90, height: 14 }} />
          <span className="wf-skel-bar" style={{ width: 90, height: 14 }} />
        </div>
        <div className="wf-skel-line">
          {[170, 200, 150].map((w) => (
            <span key={w} className="wf-skel-bar" data-shape="chip" style={{ width: w, height: 22 }} />
          ))}
        </div>
      </div>
      {SKELETONS.map((s, i) => (
        <div key={i} aria-hidden="true" className="wf-skel-row" style={{ opacity: s.opacity }}>
          <span className="wf-skel-stack">
            <span className="wf-skel-bar" data-fill="raised" data-shape="chip" style={{ width: s.w1, height: 22 }} />
            <span className="wf-skel-bar" style={{ width: '40%', height: 10, borderRadius: 3 }} />
          </span>
          <span className="wf-skel-bar" data-shape="pill" style={{ width: 88, height: 10 }} />
          <span className="wf-skel-bar wf-skel-flex" style={{ maxWidth: s.w2, height: 12 }} />
          <span className="wf-skel-bar wf-skel-end" style={{ width: 64, height: 30 }} />
        </div>
      ))}
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
  const everything = useQuery(() => uc.arazzo.listWorkflows({}), [linked]);
  const sourcesKey = sources.join(',');
  const list = useQuery(async () => {
    const base = { query: q, sources, runKind };
    // The counts of a filter are computed with that filter left out (as in the prototype).
    const [byResult, byTarget, bySource] = await Promise.all([
      Promise.all(RESULTS.map((r) => uc.arazzo.listWorkflows({ ...base, result: r.id }))),
      Promise.all(TARGETS.map((t) => uc.arazzo.listWorkflows({ query: q, sources, runKind: t.id }))),
      uc.arazzo.listWorkflows({ query: q, runKind, result }),
    ]);
    const [all, passed, failed, never] = byResult;
    return {
      all: all ?? [],
      passed: passed ?? [],
      failed: failed ?? [],
      never: never ?? [],
      targetCounts: Object.fromEntries(TARGETS.map((t, i) => [t.id, (byTarget[i] ?? []).filter((w) => t.id === 'any' || w.lastRun).length])),
      bySource: bySource ?? [],
    };
  }, [q, sourcesKey, runKind, result, linked]);

  const items: WorkflowListItem[] = list.data?.[result] ?? [];
  const counts = list.data ? { all: list.data.all.length, passed: list.data.passed.length, failed: list.data.failed.length, never: list.data.never.length } : undefined;
  const documents = docs.data ?? [];
  const allSources = documents.flatMap((d) => d.sources);
  const unlinkedTotal = allSources.filter((s) => s.link.status === 'not-linked').length;
  const totalWorkflows = documents.reduce((n, d) => n + d.workflowIds.length, 0);
  const allWorkflows = everything.data ?? [];

  const activeDesc = [
    ...(q.trim() ? [`“${q.trim()}”`] : []),
    ...(result !== 'all' ? [RESULT_LABEL[result]] : []),
    ...(runKind !== 'any' ? [TARGET_LABEL[runKind]] : []),
    ...sources,
  ];
  const activeCount = activeDesc.length;

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
  const serviceName = (id: string) => {
    const s = serviceOf(id);
    return s ? { name: s.name, version: s.version } : undefined;
  };
  const usesSource = (w: WorkflowListItem, name: string) => w.workflow.steps.some((s) => s.sourceName === name);

  const showOnboarding = demo === 'empty' || (docs.status === 'success' && documents.length === 0);
  const loading = demo === 'loading' || ((docs.status === 'loading' || list.status === 'loading') && !list.data);
  const targetPhrase = runKind === 'any' ? 'any target' : TARGET_LABEL[runKind];

  const groups = documents
    .map((d) => ({ document: d, rows: items.filter((i) => i.document.id === d.id) }))
    .filter((g) => g.rows.length > 0);

  const countLine = showOnboarding
    ? '0 workflows · 0 Arazzo documents'
    : loading
      ? 'Loading…'
      : `${totalWorkflows} workflows · ${documents.length} Arazzo documents · ${allSources.length} source descriptions (${unlinkedTotal} not linked)`;

  const ready = !loading && !showOnboarding && docs.status === 'success';

  return (
    <div className="wf-page" data-main-pad="roomy">
      <PageHeader
        title="Workflows"
        meta={countLine}
        size="lg"
        description="Multi-step API journeys described with Arazzo. Each step calls an operation of an API already in Microcks; play them against the mocks or against your implementations, or call them through their Mock URL."
        actions={
          <>
            <ButtonRouterLink to="/sources" icon="git-branch">
              Sources
            </ButtonRouterLink>
            <ButtonRouterLink to="/sources/new" variant="primary" icon="download">
              Import Arazzo document
            </ButtonRouterLink>
          </>
        }
      />

      {linked ? (
        <Callout tone="success" title={`${linked} linked`} live="polite">
          The workflows that use it can run now.
        </Callout>
      ) : null}

      {docs.status === 'error' || list.status === 'error' ? (
        <ErrorBlock error={(docs.error ?? list.error) as Error} onRetry={() => (docs.status === 'error' ? docs.reload() : list.reload())} title="Workflows could not be loaded" />
      ) : null}

      {!showOnboarding ? (
        <FilterBar label="Workflow filters">
          <FilterRow>
            <FilterSearch label="Filter workflows" placeholder="Filter by name, workflowId or stepId…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
            <Segmented label="Last run result" options={RESULTS.map((r) => ({ ...r, count: counts?.[r.id] }))} value={result} onChange={(id) => setResult(id as Result)} />
            <Segmented
              label="Run target"
              options={TARGETS.map((t) => ({ ...t, count: list.data?.targetCounts[t.id] }))}
              value={runKind}
              onChange={(id) => setRunKind(id as RunKindFilter)}
            />
          </FilterRow>
          <FilterRow title="Sources">
            {allSources.map((source) => {
              const linkedTo = source.link.status === 'linked' ? serviceOf(source.link.serviceId) : undefined;
              const count = (list.data?.bySource ?? []).filter((w) => usesSource(w, source.name)).length;
              const toggle = () => setSources((cur) => (cur.includes(source.name) ? cur.filter((n) => n !== source.name) : [...cur, source.name]));
              if (source.link.status === 'not-linked') {
                return (
                  <Chip key={source.name} className="wf-src-unlinked" pressed={sources.includes(source.name)} count={count} onClick={toggle}>
                    <Icon name="warning" size={13} strokeWidth={2.2} />
                    {source.name} · not linked
                  </Chip>
                );
              }
              return (
                <Chip key={source.name} protocol={source.link.protocol} pressed={sources.includes(source.name)} count={count} onClick={toggle}>
                  {linkedTo ? `${linkedTo.name} ${linkedTo.version}` : source.name}
                </Chip>
              );
            })}
            {activeCount > 0 ? <FilterReset count={activeCount} onClick={reset} /> : null}
          </FilterRow>
        </FilterBar>
      ) : null}

      {loading && !showOnboarding ? <LoadingGroup /> : null}

      {showOnboarding && !loading ? <Onboarding /> : null}

      {ready && items.length > 0 ? (
        <>
          <div className="wf-result-line">
            <p role="status" aria-live="off">
              <span className="wf-result-count">{items.length}</span> of {totalWorkflows} workflows · last run on {targetPhrase}
            </p>
            <p className="wf-legend">
              <span className="wf-legend-lead">Steps: one dot per step, one lane per source</span>
              <span className="wf-legend-item">
                <span aria-hidden="true" className="wf-loom-dot" data-state="ok" data-legend="" />
                passed
              </span>
              <span className="wf-legend-item">
                <span aria-hidden="true" className="wf-loom-dot" data-state="ko" data-legend="" />
                failed
              </span>
              <span className="wf-legend-item">
                <span aria-hidden="true" className="wf-loom-dot" data-state="skip" data-legend="" />
                not reached
              </span>
              <span className="wf-legend-item">
                <span aria-hidden="true" className="wf-loom-dot" data-state="never" data-legend="" />
                never run
              </span>
              <span className="wf-legend-item">
                <span aria-hidden="true" className="wf-legend-bars">
                  <span />
                  <span />
                </span>
                parallel branches (step dependsOn)
              </span>
            </p>
          </div>

          <div className="wf-groups">
            {groups.map(({ document, rows }) => (
              <DocumentGroup
                key={document.id}
                document={document}
                rows={rows}
                docWorkflows={allWorkflows.filter((w) => w.document.id === document.id)}
                total={document.workflowIds.length}
                serviceName={serviceName}
                relative={relative}
                runKind={runKind}
                onLink={(source) => setLinking({ document, source })}
              />
            ))}
          </div>
        </>
      ) : null}

      {ready && list.data && items.length === 0 ? (
        <EmptyState
          title="No workflow matches these filters"
          icon="search-x"
          actions={
            <Button variant="primary" icon="reset" onClick={reset}>
              Reset filters
            </Button>
          }
        >
          <p>
            None of the {totalWorkflows} workflows matches: {activeDesc.join(' · ')}. Remove a filter or reset the selection.
          </p>
        </EmptyState>
      ) : null}

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

      <section aria-label="Prototype states" className="wf-demo">
        <span>Prototype states</span>
        <button type="button" className="wf-demo-btn" aria-pressed={demo === 'loading'} onClick={() => setDemo((d) => (d === 'loading' ? null : 'loading'))}>
          Show loading
        </button>
        <button type="button" className="wf-demo-btn" aria-pressed={demo === 'empty'} onClick={() => setDemo((d) => (d === 'empty' ? null : 'empty'))}>
          Show empty state
        </button>
      </section>
    </div>
  );
}

interface DocumentGroupProps {
  document: ArazzoDocument;
  rows: WorkflowListItem[];
  /** Every workflow of the document, whatever the filters (step counts of the sources, warning title). */
  docWorkflows: WorkflowListItem[];
  total: number;
  serviceName: (id: string) => { name: string; version: string } | undefined;
  relative: (date: string) => string;
  runKind: RunKindFilter;
  onLink: (source: SourceDescription) => void;
}

function DocumentGroup({ document: doc, rows, docWorkflows, total, serviceName, relative, runKind, onLink }: DocumentGroupProps) {
  const unlinked = doc.sources.filter((s) => s.link.status === 'not-linked');
  const linkedCount = doc.sources.length - unlinked.length;
  const synced = doc.origin.startsWith('Synced');
  const stepsOn = (name: string) => docWorkflows.reduce((n, w) => n + w.workflow.steps.filter((s) => s.sourceName === name).length, 0);
  const blockedBy = docWorkflows
    .filter((w) => w.workflow.steps.some((s) => unlinked.some((u) => u.name === s.sourceName)))
    .map((w) => w.workflow.workflowId);

  return (
    <section aria-label={`Arazzo document ${doc.file}`} className="wf-doc">
      <div className="wf-doc-header">
        <div className="wf-doc-title-row">
          <div className="wf-doc-title">
            <Icon name="file-text" size={18} strokeWidth={1.8} className="wf-text2" />
            <h2>{doc.file}</h2>
            <span className="wf-doc-name">{doc.title}</span>
            <span className="wf-tag">arazzo {doc.arazzoVersion}</span>
            <span className="wf-tag">version {doc.version}</span>
          </div>
          <span className="wf-doc-origin">
            <Icon name={synced ? 'sync' : 'upload'} size={14} />
            {synced ? (
              <>
                <span>{doc.origin} via</span>
                <RouterLink to="/sources" className="wf-plain-link">
                  {doc.title}
                </RouterLink>
              </>
            ) : (
              <span>{doc.origin}</span>
            )}
          </span>
        </div>

        <p className="wf-overlay">
          {doc.overlay ? (
            <>
              <Icon name="layers" size={15} strokeWidth={1.8} />
              <span>ArazzoSources overlay</span>
              <code>{doc.overlay}</code>
              <span className="wf-tag" data-tone="success">
                imported
              </span>
              <span className="wf-muted-text">links the sources, carries the recorded examples</span>
            </>
          ) : (
            <>
              <Icon name="layers-missing" size={15} strokeWidth={1.8} className="wf-muted-text" />
              <span className="wf-muted-text">No ArazzoSources overlay · sources linked in the import dialog</span>
            </>
          )}
          <span className="wf-linked-count" data-tone={unlinked.length ? 'warning' : 'success'}>
            <Icon name={unlinked.length ? 'warning' : 'check-circle'} size={15} strokeWidth={2.2} />
            {linkedCount} of {doc.sources.length} linked
          </span>
        </p>

        <div className="wf-src-box">
          <div role="table" aria-label={`Source descriptions of ${doc.file}`} className="wf-src-table">
            <div role="row" className="wf-src-row wf-grid-head">
              <span role="columnheader">Source description</span>
              <span role="columnheader">Declared URL</span>
              <span role="columnheader">Microcks API</span>
              <span role="columnheader">Step operations</span>
            </div>
            {doc.sources.map((s) => {
              const svc = s.link.status === 'linked' ? serviceName(s.link.serviceId) : undefined;
              return (
                <div role="row" key={s.name} className="wf-src-row">
                  <span role="cell" className="wf-src-name">
                    <code>{s.name}</code>
                    <span className="wf-src-type">{s.type}</span>
                  </span>
                  <code role="cell" className="wf-src-url">
                    {s.url}
                  </code>
                  <span role="cell" className="wf-src-api">
                    {s.link.status === 'linked' ? (
                      <>
                        <RouterLink
                          to={`/services/${s.link.serviceId}`}
                          className="wf-badge-link"
                          aria-label={`${s.link.protocol} ${svc?.name ?? s.link.serviceId} ${svc?.version ?? ''}: ${s.name} is linked to it, open the API`}
                        >
                          <ApiBadge protocol={s.link.protocol} name={svc?.name ?? s.link.serviceId} version={svc?.version} size="sm" className="wf-src-badge" />
                        </RouterLink>
                        <span className="wf-linked">
                          <Icon name="check" size={12} strokeWidth={2.4} />
                          Linked
                        </span>
                      </>
                    ) : (
                      <span className="wf-not-linked">
                        <Icon name="warning" size={12} strokeWidth={2.4} />
                        Not linked
                      </span>
                    )}
                  </span>
                  <span role="cell" className="wf-src-ops" data-tone={s.link.status === 'linked' ? undefined : 'warning'}>
                    <Icon name={s.link.status === 'linked' ? 'check-circle' : 'warning'} size={12} strokeWidth={2.2} />
                    {s.link.status === 'linked' ? s.link.operationsFound : `${stepsOn(s.name)} steps unresolved`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {unlinked.length > 0 ? (
          <div role="status" className="wf-warn">
            <Icon name="warning" size={18} className="wf-warn-icon" />
            <div className="wf-warn-text">
              <span className="wf-warn-title">
                {blockedBy.join(', ') || 'Its workflows'} cannot run until {unlinked.map((s) => s.name).join(', ')} {unlinked.length === 1 ? 'is' : 'are'} linked
              </span>
              <span className="wf-warn-hint">
                Beer Catalog API 1.0 is not in Microcks yet: import beer-catalog-1.0-openapi.yaml first, or pick the API to link in the dialog.
              </span>
            </div>
            <Button size="sm" icon="link" className="wf-warn-btn" onClick={() => unlinked[0] && onLink(unlinked[0])}>
              Link sources
            </Button>
          </div>
        ) : null}
      </div>

      <div className="wf-rows-box">
        <div role="table" aria-label={`Workflows of ${doc.file} (${rows.length} of ${total})`} className="wf-rows">
          <div role="row" className="wf-wrow wf-grid-head">
            <span role="columnheader">Workflow</span>
            <span role="columnheader">Steps</span>
            <span role="columnheader">Sources</span>
            <span role="columnheader">Inputs</span>
            <span role="columnheader">Last run</span>
            <span role="columnheader">Mock URL</span>
            <span role="columnheader">
              <span className="sr-only">Run</span>
            </span>
          </div>
          {rows.map((row) => (
            <WorkflowRow key={row.workflow.workflowId} row={row} serviceName={serviceName} relative={relative} runKind={runKind} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowRow({
  row: { workflow, document, lastRun, lastMockUrlRun },
  serviceName,
  relative,
  runKind,
}: {
  row: WorkflowListItem;
  serviceName: DocumentGroupProps['serviceName'];
  relative: (date: string) => string;
  runKind: RunKindFilter;
}) {
  const runnable = workflow.runnability.runnable;
  const reason = workflow.runnability.runnable ? undefined : workflow.runnability.reason;
  const message = workflow.runnability.runnable ? '' : workflow.runnability.message;
  const reasonId = `wf-reason-${workflow.workflowId}`;
  const names = [...new Set(workflow.steps.map((s) => s.sourceName))];
  const unlinkedNames = names.filter((n) => !sourceColor(document, n).linked);
  const outcome = lastRun ? runOutcome(lastRun) : 'never';
  const shown = outcome === 'running' ? 'never' : outcome;
  const note = lastRun ? runNote(lastRun) : '';

  return (
    <div role="row" className="wf-wrow">
      <div role="cell" className="wf-cell wf-cell-workflow">
        <RouterLink to={workflowPath(document.id, workflow.workflowId)} className="wf-badge-link wf-name-link">
          <ApiBadge arazzo name={workflow.summary} version={document.version} className="wf-name-badge" />
        </RouterLink>
        <div className="wf-cell-line">
          <code className="wf-id">{workflow.workflowId}</code>
          {reason === 'asyncapi-steps' ? <span className="wf-tag" data-border="strong">AsyncAPI steps · Arazzo 1.1</span> : null}
          {!runnable ? (
            <span className="wf-block">
              <Icon name="ban" size={11} strokeWidth={2.4} />
              {reason === 'asyncapi-steps' ? 'Cannot run yet: AsyncAPI steps' : 'Not linked'}
            </span>
          ) : null}
        </div>
        {!runnable ? <span className="wf-note">{message}</span> : null}
      </div>

      <div role="cell" className="wf-cell wf-cell-steps">
        <LoomThumb workflow={workflow} document={document} run={lastRun} />
        <span className="wf-steps-text">
          {workflow.steps.length} steps{workflow.steps.some((s) => s.dependsOn?.length) ? ' · dependsOn' : ''}
        </span>
      </div>

      <div role="cell" className="wf-cell wf-cell-sources">
        {names.map((n) => {
          const { color, linked } = sourceColor(document, n);
          const src = document.sources.find((s) => s.name === n);
          const svc = src?.link.status === 'linked' ? serviceName(src.link.serviceId) : undefined;
          return (
            <span key={n} className="wf-src-tag" data-linked={linked ? '' : undefined}>
              {linked ? (
                <span aria-hidden="true" className="wf-swatch" style={{ background: color }} />
              ) : (
                <Icon name="warning" size={11} strokeWidth={2.6} className="wf-warning-icon" />
              )}
              {n}
              <span className="sr-only">{linked ? (svc ? ` (linked to ${svc.name} ${svc.version})` : '') : ' (not linked)'}</span>
            </span>
          );
        })}
      </div>

      <div
        role="cell"
        className="wf-cell wf-cell-inputs"
        aria-label={workflow.inputs.length ? `${workflow.inputs.length} inputs: ${workflow.inputs.map((i) => i.name).join(', ')}` : 'No input'}
      >
        <span aria-hidden="true" className="wf-inputs-count">
          {workflow.inputs.length}
        </span>
        <span aria-hidden="true" className="wf-inputs-names">
          {workflow.inputs.length ? workflow.inputs.map((i) => i.name).join(' ') : 'none'}
        </span>
      </div>

      <div role="cell" className="wf-cell wf-cell-last">
        <span className="wf-cell-line">
          <span className="wf-result-word" data-result={shown}>
            <Icon name={shown === 'passed' ? 'check-circle' : shown === 'failed' ? 'x-circle' : 'never-tested'} size={15} strokeWidth={shown === 'never' ? 2 : 2.2} />
            {shown === 'passed' ? 'Passed' : shown === 'failed' ? 'Failed' : 'Never run'}
          </span>
          {lastRun ? <span className="wf-tag">{targetLabel(lastRun)}</span> : null}
        </span>
        {lastRun ? (
          <>
            <RouterLink
              to={runPath(lastRun.id)}
              className="wf-mono-link"
              aria-label={`#${lastRun.number} · ${relative(lastRun.startedAt)}, open run of ${workflow.workflowId}, ${targetLabel(lastRun)}, ${shown === 'passed' ? 'Passed' : 'Failed'}`}
            >
              #{lastRun.number} · {relative(lastRun.startedAt)}
            </RouterLink>
            {note ? <span className="wf-run-note">{note}</span> : null}
          </>
        ) : (
          <span className="wf-note">{!runnable ? 'Run disabled' : runKind === 'any' ? 'no run yet' : `no run with ${TARGET_LABEL[runKind]}`}</span>
        )}
      </div>

      <div role="cell" className="wf-cell wf-cell-mock">
        <span className="wf-mock-state" data-ready={runnable ? '' : undefined}>
          <Icon name={runnable ? 'link' : 'never-tested'} size={15} />
          {runnable ? 'Ready' : 'Not available'}
        </span>
        {runnable ? (
          <RouterLink to={workflowPath(document.id, workflow.workflowId, 'mock-url')} title={`POST ${workflow.mockUrl}`} className="wf-mono-link wf-mock-path">
            POST …/{document.version}/{workflow.workflowId}
          </RouterLink>
        ) : null}
        <span className="wf-note">
          {!runnable
            ? reason === 'asyncapi-steps'
              ? 'AsyncAPI steps cannot be played yet'
              : `Link ${unlinkedNames.join(', ') || 'its sources'} first`
            : lastMockUrlRun
              ? `Last call ${relative(lastMockUrlRun.startedAt)} (run #${lastMockUrlRun.number})`
              : 'Never called'}
        </span>
      </div>

      <div role="cell" className="wf-cell-run">
        {runnable ? (
          <ButtonRouterLink to={runSetupPath(document.id, workflow.workflowId)} size="sm" icon="play">
            Run<span className="sr-only"> {workflow.workflowId}</span>
          </ButtonRouterLink>
        ) : (
          <>
            <Button size="sm" disabled icon="play" title={message} aria-describedby={reasonId} className="wf-run-disabled">
              Run<span className="sr-only"> {workflow.workflowId}</span>
            </Button>
            <span id={reasonId} className="sr-only">
              {message}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
