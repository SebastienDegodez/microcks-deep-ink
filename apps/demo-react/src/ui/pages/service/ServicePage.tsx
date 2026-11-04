import '../explore-kit/explore.css';
import './service.css';
import { useState, type HTMLAttributes } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router';
import { formatDay, formatHourMinute } from '@/domain/importing';
import { buildSnippet, exampleUrlPath, paramLines, requestHead, type SnippetFormat, type WorkflowUsage } from '@/domain/catalog';
import { labelToString, type Example, type Operation } from '@/domain/shared';
import { PageHeader, useAnnounce, useClock, useQuery, useRelativeTime, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Exchange, ExchangeCard } from '@/ui/components/ui/exchange-card';
import { FactRow, Facts } from '@/ui/components/ui/facts';
import { Icon, type IconName } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { Menu } from '@/ui/components/ui/menu';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { OpPickList } from '@/ui/components/ui/op-pick';
import { SectionLabel } from '@/ui/components/ui/section-label';
import { TabPanel, Tabs } from '@/ui/components/ui/tabs';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import AgentPage from '../agent/AgentPage';
import { MONTHS, fmt, pluralize } from '@/ui/app/format';

type TabId = 'operations' | 'properties' | 'tests';
const TAB_IDS: TabId[] = ['operations', 'properties', 'tests'];
const DAY_MS = 86_400_000;
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TARGET_LABEL = { mocks: 'Microcks mocks', implementations: 'Implementations', mixed: 'Mocks and implementations' } as const;
const RECENT_RUNS = 3;

const examplesLabel = (n: number) => pluralize(n, 'example');
const exampleSub = (e: Example) => Object.entries(e.request.params).map(([k, v]) => `${k}=${v}`).join(' · ') || 'no parameter';

/**
 * A `<pre>` that may scroll sideways. The scroll container must be keyboard reachable (WCAG 2.1.1), so it is
 * focusable and named, like the registry's code-block.
 */
function ScrollPre({ children, ...rest }: HTMLAttributes<HTMLPreElement> & { 'aria-label': string; 'data-tone'?: string; 'data-grow'?: string }) {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- named scroll region, see above
    <pre tabIndex={0} role="region" {...rest}>
      {children}
    </pre>
  );
}

/** Calls of the last 7 days, the last bar being today (demo clock). */
function Sparkline({ values, total, today }: { values: number[]; total: number; today: Date }) {
  const max = Math.max(1, ...values);
  const days = values.map((_, i) => new Date(today.getTime() - (values.length - 1 - i) * DAY_MS));
  const long = (d: Date | undefined) => !d ? '' : `${DAY_NAMES[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return (
    <div className="spark-box">
      <div className="spark-box-head">
        <span>Calls · 7 days</span>
        <span className="spark-box-total">{fmt(total)}</span>
      </div>
      <div className="spark-box-bars" role="img" aria-label={`Calls over 7 days: ${values.map((v, i) => `${long(days[i])} ${fmt(v)}`).join(', ')}`}>
        {values.map((v, i) => (
          <span key={i} data-today={i === values.length - 1 ? '' : undefined} style={{ height: `${Math.max(6, Math.round((v / max) * 100))}%` }} title={`${long(days[i])}: ${fmt(v)} calls`} />
        ))}
      </div>
      <div className="spark-box-days" aria-hidden="true">
        {days.map((d, i) => <span key={i}>{DAY_LETTERS[d.getUTCDay()]}</span>)}
      </div>
    </div>
  );
}

function WorkflowResult({ usage, relative }: { usage: WorkflowUsage; relative: (d: string) => string }) {
  const r = usage.result;
  let icon: IconName = 'minus-circle';
  let text = 'Never run';
  let tone = 'never';
  if (r?.kind === 'blocked') {
    icon = 'warning';
    text = r.reason;
    tone = 'blocked';
  } else if (r?.kind === 'passed' || r?.kind === 'failed') {
    icon = r.kind === 'passed' ? 'check-circle' : 'x-circle';
    text = `${r.kind === 'passed' ? 'Passed' : 'Failed'} #${r.runNumber} · ${TARGET_LABEL[r.target]} · ${relative(r.at)}`;
    tone = r.kind;
  }
  return (
    <span className="wf-usage-result" data-tone={tone}>
      <Icon name={icon} size={13} />
      {text}
    </span>
  );
}

function ApiServicePage() {
  const { serviceId = '', tab } = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const uc = useUseCases();
  const clock = useClock();
  const relative = useRelativeTime();
  const announce = useAnnounce();
  const tabId: TabId = TAB_IDS.includes(tab as TabId) ? (tab as TabId) : 'operations';
  const [format, setFormat] = useState<SnippetFormat>('curl');
  const [rejected, setRejected] = useState<Example | undefined>();

  const service = useQuery(() => uc.catalog.getService(serviceId), [uc, serviceId]);
  const details = useQuery(() => uc.catalog.getServiceDetails(serviceId), [uc, serviceId]);
  const ops = useQuery(() => uc.catalog.listOperations(serviceId), [uc, serviceId]);
  const usages = useQuery(() => uc.catalog.workflowUsages(serviceId), [uc, serviceId]);
  const runs = useQuery(() => uc.testing.listForService(serviceId), [uc, serviceId]);
  const opParam = search.get('op');
  // Like the prototype, open on the "by name" operation, the one that carries the AI proposal.
  const currentOp: Operation | undefined = ops.data?.find((o) => o.id === opParam) ?? ops.data?.find((o) => o.id === 'get-name') ?? ops.data?.[0];
  // Examples of every operation: the rail shows each operation's count and its pending AI proposal.
  const allExamples = useQuery(
    () => Promise.all((ops.data ?? []).map(async (o) => [o.id, await uc.catalog.listExamples(serviceId, o.id)] as const)).then((rows) => Object.fromEntries(rows) as Record<string, Example[]>),
    [uc, serviceId, ops.data],
  );
  usePageTitle(service.data ? `${service.data.name} ${service.data.version} · Microcks` : 'Service · Microcks');

  if (service.status === 'error' && !service.data) {
    return (
      <>
        <PageHeader title="Service" />
        <ErrorBlock error={service.error} what="The service" onRetry={service.reload} />
      </>
    );
  }
  const svc = service.data;
  const det = details.data;
  if (!svc || !det) {
    return (
      <>
        <PageHeader title="Service" />
        <LoadingBlock label="the service" />
      </>
    );
  }

  const list = (currentOp && allExamples.data?.[currentOp.id]) || [];
  const pending = list.filter((e) => e.reviewState === 'pending');
  const accepted = list.filter((e) => e.reviewState !== 'pending');
  const fromContract = accepted.filter((e) => !e.aiGenerated);
  const aiAccepted = accepted.filter((e) => e.aiGenerated);
  const ordered = [...accepted, ...pending];
  const selected = ordered.find((e) => e.id === search.get('example')) ?? accepted[0] ?? ordered[0];
  const pendingTotal = Object.values(allExamples.data ?? {}).reduce((n, l) => n + l.filter((e) => e.reviewState === 'pending').length, 0);
  const select = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) next.delete(k);
      else next.set(k, v);
    }
    setSearch(next, { replace: true });
  };
  const goTab = (id: string) => navigate({ pathname: `/services/${serviceId}/${id}`, search: search.toString() });

  const spec = currentOp && selected
    ? { method: currentOp.method, pathTemplate: currentOp.path, example: selected, mockBase: det.mockBase, mcpBase: det.mcp?.httpUrl ?? '', mcpTool: currentOp.mcpTool }
    : undefined;
  const mockUrl = spec ? `${det.mockBase}${exampleUrlPath(spec.pathTemplate, spec.example.request.params)}` : det.mockBase;
  const allUsages = usages.data ?? [];
  const stepRefs = allUsages.flatMap((u) => (u.steps ?? []).filter((s) => s.catalogOperationId === currentOp?.id).map((s) => ({ ref: `${u.summary} › ${s.stepId}`, operationId: s.operationId })));
  const recentRuns = (runs.data ?? []).slice(0, RECENT_RUNS);
  const latestRun = runs.data?.[0];
  // The AI proposal is built from the response schema, named after the API's resource ("API Pastry" → Pastry).
  const schemaName = svc.name.split(' ').pop() ?? svc.name;

  const accept = async (e: Example) => {
    if (!currentOp) return;
    await uc.copilot.accept(serviceId, currentOp.id, e);
    announce(`Accepted ${e.name}. The mock serves it now.`);
    allExamples.reload();
  };
  const reject = async (e: Example) => {
    if (!currentOp) return;
    await uc.catalog.removeExample(serviceId, currentOp.id, e.id);
    setRejected(e);
    if (selected?.id === e.id) select({ example: undefined });
    announce(`Rejected ${e.name}.`);
    allExamples.reload();
  };
  const undo = async () => {
    if (!currentOp || !rejected) return;
    await uc.catalog.addExamples(serviceId, currentOp.id, [rejected]);
    setRejected(undefined);
    announce('Proposal restored.');
    allExamples.reload();
  };

  const header = (
    <PageHeader
      variant="badge"
      align="start"
      title={<ApiBadge protocol={svc.protocol} name={`${svc.name} ${svc.version}`} size="xl" />}
      breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${svc.name} ${svc.version}` }]}
      breadcrumbSeparator="/"
      badge={<LiveIndicator label={`mock live · last call ${relative(det.lastCallAt)}`} />}
      description={det.description}
      descriptionTone="secondary"
      actions={
        <>
          <Button asChild variant="primary" icon="play"><RouterLink to={`/tests/create?service=${svc.id}`}>Run a test</RouterLink></Button>
          <Button asChild variant="secondary" icon="spark" className="service-ai-action"><RouterLink to={`/services/${svc.id}/copilot${currentOp ? `?op=${currentOp.id}` : ''}`}>Generate examples (AI)</RouterLink></Button>
          <Menu
            label="More actions"
            icon="more-vertical"
            iconOnly
            variant="secondary"
            align="end"
            items={[
              { id: 'labels', label: 'Edit labels', onSelect: () => announce('Edit labels is not part of this demo.') },
              { id: 'docs', label: 'View OpenAPI documentation', onSelect: () => announce('Documentation opens in the real product.') },
              { id: 'download', label: 'Download contract', onSelect: () => announce('Contract download is not part of this demo.') },
              { id: 'delete', label: 'Delete Service', danger: true, separatorBefore: true, onSelect: () => announce('Delete is disabled in the demo.') },
            ]}
          />
        </>
      }
    >
      <div className="service-head-row">
        {svc.labels.map((l) => <Chip key={labelToString(l)} variant="outline">{labelToString(l)}</Chip>)}
        <span className="service-head-dates">Created {det.createdLabel} · imported {formatDay(det.importedAt)} at {formatHourMinute(det.importedAt)}</span>
      </div>
      <div className="service-head-proofs">
        <ApiBadge label="conformance" value={svc.conformance === null ? 'untested' : `${svc.conformance}%`} status={svc.conformance === null ? 'neutral' : svc.conformance >= 90 ? 'success' : svc.conformance >= 60 ? 'warning' : 'danger'} />
        <ApiBadge label="mcp" value={svc.mcp ? 'agent-ready' : 'not exposed'} status={svc.mcp ? 'info' : 'neutral'} />
        <ApiBadge
          label="samples"
          value={String(svc.exampleCount ?? 0)}
          status="action"
          values={pendingTotal > 0 ? [{ value: `+${pendingTotal} AI`, status: 'warning' }] : undefined}
          className="service-samples"
        />
      </div>
    </PageHeader>
  );

  return (
    <div className="ex-stack service-page">
      {header}
      <Tabs
        label="Service sections"
        idPrefix="svc"
        value={tabId}
        onChange={goTab}
        items={[
          { id: 'operations', label: 'Operations', count: ops.data?.length },
          { id: 'properties', label: 'Properties & MCP' },
          { id: 'tests', label: 'Tests', count: runs.data ? recentRuns.length : undefined },
        ]}
      >
        <TabPanel id="operations" idPrefix="svc" value={tabId}>
          <div className="service-ops">
            <div className="op-rail">
              <SectionLabel as="p" size="sm" weight="regular" split className="op-rail-head"><span>{pluralize(ops.data?.length ?? 0, 'operation')}</span><span>calls · 7 d</span></SectionLabel>
              <OpPickList
                label={`Operations of ${svc.name} ${svc.version}`}
                value={currentOp?.id}
                onChange={(id) => select({ op: id, example: undefined })}
                options={(ops.data ?? []).map((o) => {
                  const exs = allExamples.data?.[o.id] ?? [];
                  const ai = exs.filter((e) => e.reviewState === 'pending').length;
                  return {
                    id: o.id,
                    method: o.method,
                    protocol: svc.protocol,
                    path: o.path,
                    summary: o.summary,
                    meta: allExamples.data ? `${examplesLabel(exs.length - ai)}${ai ? ` · +${ai} AI` : ''}` : undefined,
                    end: fmt(o.calls),
                    endLabel: 'Calls over 7 days: ',
                  };
                })}
              />
              <p className="op-rail-note">Every operation is served as soon as the contract is imported. No code, no deployment.</p>
            </div>
            {currentOp ? (
              <section aria-label="Operation detail" className="op-detail">
                <div className="op-detail-head">
                  <div className="op-detail-title">
                    <div className="op-detail-title-row">
                      <MethodTag method={currentOp.method} protocol={svc.protocol} />
                      <h2>{currentOp.path}</h2>
                    </div>
                    <span className="op-detail-summary">{currentOp.summary}{currentOp.mcpTool ? <> · MCP tool <span className="op-detail-tool">{currentOp.mcpTool}</span></> : null}</span>
                  </div>
                  <Sparkline values={currentOp.spark} total={currentOp.calls} today={clock.now()} />
                </div>

                <div className="op-mock">
                  <SectionLabel as="label" htmlFor="mock-url">Mock URL</SectionLabel>
                  <div className="op-mock-url">
                    <Input id="mock-url" mono readOnly value={mockUrl} />
                    <CopyButton value={mockUrl} size="md" label="Copy" />
                  </div>
                  {spec ? (
                    <CodeBlock
                      code={buildSnippet(format, spec)}
                      language="shell"
                      tabsLabel="Call format"
                      tabs={[{ id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }, ...(currentOp.mcpTool ? [{ id: 'mcp', label: 'MCP tool call' }] : [])]}
                      tab={format}
                      onTabChange={(id) => setFormat(id as SnippetFormat)}
                      copy
                    />
                  ) : null}
                </div>

                <div className="dispatch-strip">
                  <span className="dispatch-strip-item"><span className="dispatch-strip-key">Dispatcher</span><span className="dispatch-strip-value">{currentOp.dispatcher} · rule: {currentOp.rule}</span></span>
                  <span className="dispatch-strip-sep" aria-hidden="true" />
                  <span className="dispatch-strip-item"><span className="dispatch-strip-key">Delay</span><span className="dispatch-strip-value">{currentOp.delayMs} ms</span><span className="dispatch-strip-key">fixed</span></span>
                  <Button asChild size="sm" variant="secondary" icon="pencil" className="dispatch-strip-edit"><RouterLink to={`/services/${svc.id}/operations/${currentOp.id}`}>Edit behavior</RouterLink></Button>
                </div>

                <div role="group" aria-labelledby="wf-used-title" className="wf-usage">
                  <div className="wf-usage-head">
                    <h3 id="wf-used-title"><Icon name="dispatcher" size={15} />Used in {pluralize(allUsages.length, 'workflow')}</h3>
                    <RouterLink to="/workflows">All workflows</RouterLink>
                  </div>
                  <span className="wf-usage-line">
                    <span className="wf-usage-op">{currentOp.method} {currentOp.path}</span>{' '}
                    {stepRefs.length === 0
                      ? 'is not called by any workflow step.'
                      : `is called by ${pluralize(stepRefs.length, 'workflow step')}: ${stepRefs.map((s) => s.ref).join(', ')} (operationId ${stepRefs[0]?.operationId}).`}
                  </span>
                  <ul className="wf-usage-list">
                    {allUsages.map((u) => (
                      <li key={`${u.documentId}/${u.workflowId}`}>
                        <RouterLink to={`/workflows/${u.documentId}/${u.workflowId}`} className="wf-usage-name">{u.summary}</RouterLink>
                        <span className="wf-usage-steps">
                          {(u.steps ?? []).map((s) => {
                            const on = s.catalogOperationId === currentOp.id;
                            return (
                              <span key={s.stepId} className="wf-usage-step" data-on={on ? '' : undefined} title={`operationId: ${s.operationId}${on ? ' · calls this operation' : ''}`}>
                                {s.stepId}
                                <span className="sr-only"> (operationId {s.operationId}{on ? ', calls this operation' : ''})</span>
                              </span>
                            );
                          })}
                        </span>
                        <WorkflowResult usage={u} relative={relative} />
                      </li>
                    ))}
                    {allUsages.length === 0 ? <li className="wf-usage-empty">No workflow calls this service.</li> : null}
                  </ul>
                </div>

                <div className="op-examples" aria-busy={allExamples.status === 'loading'}>
                  <div className="op-examples-head">
                    <h3>Examples</h3>
                    <span>
                      {examplesLabel(fromContract.length)} from the contract
                      {pending.length ? ` · ${pluralize(pending.length, 'AI proposal')} pending` : ''}
                      {aiAccepted.length ? ` · ${pluralize(aiAccepted.length, 'AI example')} accepted` : ''}
                    </span>
                  </div>
                  <div className="op-examples-body">
                    <div className="example-col">
                    <ul className="example-list" aria-label="Examples of the operation">
                      {ordered.map((e) => {
                        const ghost = e.reviewState === 'pending';
                        return (
                          <li key={e.id} className="example-pick" data-ghost={ghost ? '' : undefined} data-selected={e.id === selected?.id ? '' : undefined}>
                            <button type="button" aria-pressed={e.id === selected?.id} onClick={() => select({ example: e.id })}>
                              <span className="example-pick-status">{e.response.status}</span>
                              <span className="example-pick-main">
                                <span className="example-pick-name">{e.name}</span>
                                <span className="example-pick-sub">{exampleSub(e)}</span>
                              </span>
                            </button>
                            {ghost ? (
                              <div className="example-pick-review">
                                <span className="example-pick-review-note"><Icon name="spark" size={13} />Generated by AI, review needed</span>
                                <span className="example-pick-review-actions">
                                  <button type="button" className="example-pick-accept" aria-label={`Accept ${e.name}`} onClick={() => void accept(e)}>Accept</button>
                                  <button type="button" className="example-pick-reject" aria-label={`Reject ${e.name}`} onClick={() => void reject(e)}>Reject</button>
                                </span>
                              </div>
                            ) : e.aiGenerated ? (
                              <div className="example-pick-accepted"><Icon name="check" size={13} />AI example accepted by MA</div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                    {rejected ? (
                      <div className="example-rejected" role="status">
                        AI proposal rejected.
                        <button type="button" onClick={() => void undo()}>Undo</button>
                      </div>
                    ) : null}
                    </div>
                    {selected && spec ? (
                      <div className="example-detail">
                        {selected.reviewState === 'pending' ? (
                          <Callout tone="ai" variant="outline" title="">
                            Proposed by AI from the contract's <span className="ex-mono">{schemaName}</span> schema. The mock only serves it once accepted.
                          </Callout>
                        ) : null}
                        <Exchange>
                          <ExchangeCard
                            title="Request"
                            label={`Request of ${selected.name}`}
                            meta={selected.name}
                            headingLevel="none"
                            blocks={[
                              { label: 'Request line and headers', text: requestHead(spec), tone: 'secondary' },
                              ...(Object.keys(selected.request.params).length ? [{ label: 'Parameters', text: paramLines(spec.pathTemplate, selected.request.params), tone: 'params' as const }] : []),
                              ...(selected.request.body ? [{ label: 'Request body', text: selected.request.body }] : []),
                            ]}
                          />
                          <ExchangeCard
                            title="Response"
                            label={`Response of ${selected.name}`}
                            status={`${selected.response.status}${selected.response.status === 200 ? ' OK' : ''}`}
                            headingLevel="none"
                            blocks={[
                              { label: 'Response headers', text: `Content-Type: application/json\nContent-Length: ${selected.response.body.length}`, tone: 'headers' },
                              { label: 'Response body', text: selected.response.body, grow: true },
                            ]}
                          />
                        </Exchange>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </TabPanel>

        <TabPanel id="properties" idPrefix="svc" value={tabId}>
          <div className="service-props">
            <section aria-labelledby="props-title" className="service-card props-card">
              <h2 id="props-title">Properties</h2>
              <Facts size="lg" termWidth="150px">
                <FactRow term="Version" mono>{svc.version}</FactRow>
                <FactRow term="Type"><span className="facts-inline"><MethodTag method={svc.protocol} protocol={svc.protocol} className="facts-proto" /><span className="ex-secondary">{svc.format}</span></span></FactRow>
                {det.artifacts.map((a) => (
                  <FactRow key={a.file} term={a.role === 'primary' ? 'Primary artifact' : 'Secondary artifact'} sub={<span className="facts-kind">{a.kind} · {a.summary}</span>}>
                    <span className="facts-file">{a.file}</span>
                  </FactRow>
                ))}
                <FactRow term="Last import" sub={det.lastImportSummary}>{formatDay(det.importedAt)} at {formatHourMinute(det.importedAt)} · {relative(det.importedAt)}</FactRow>
                <FactRow term="Created">{formatDay(det.createdAt)}</FactRow>
                <FactRow term="Statistics"><span className="facts-inline ex-secondary">{fmt(det.calls7d)} calls over 7 days <RouterLink to="/usage" className="facts-link">Usage details</RouterLink></span></FactRow>
              </Facts>
            </section>
            {det.mcp ? (
              <section aria-labelledby="agent-ready-title" className="service-card agent-card">
                <div className="agent-card-head">
                  <div className="agent-card-title">
                    <h2 id="agent-ready-title">Agent-ready</h2>
                    <ApiBadge label="mcp" value={pluralize(det.mcp.tools.length, 'tool')} status="info" />
                  </div>
                  <CopyButton value={det.mcp.clientConfig} label="Copy MCP config" size="md" variant="primary" />
                </div>
                <p className="agent-card-lead">Every mock operation is published as an MCP tool. An AI agent discovers it via <span className="ex-mono">tools/list</span> and calls it with arguments derived from the contract's schemas: path, query and body grouped under <span className="ex-mono">params.arguments</span>.</p>
                <div className="agent-card-block">
                  <SectionLabel as="h3">Endpoints</SectionLabel>
                  {[
                    { name: 'HTTP SSE', spec: 'MCP 2024-11-05', url: det.mcp.sseUrl },
                    { name: 'Streamable HTTP', spec: 'MCP 2025-03-26', url: det.mcp.httpUrl },
                  ].map((e) => (
                    <div key={e.name} className="endpoint-row">
                      <span className="endpoint-row-name"><span>{e.name}</span><span className="endpoint-row-spec">{e.spec}</span></span>
                      <span className="endpoint-row-url" title={e.url}>{e.url}</span>
                      <CopyButton value={e.url} label="Copy" variant="link" aria-label={`Copy ${e.name} URL`} className="endpoint-row-copy" />
                    </div>
                  ))}
                </div>
                <div className="agent-card-block">
                  <SectionLabel as="h3">Exposed tools, as an agent sees them</SectionLabel>
                  {det.mcp.tools.map((t) => (
                    <div key={t.name} className="tool-card">
                      <div className="tool-card-main">
                        <span className="tool-card-name">{t.name}</span>
                        <span className="tool-card-desc">{t.description}</span>
                        <span className="tool-card-op"><MethodTag method={t.method} protocol={svc.protocol} className="tool-card-method" /><span className="ex-mono">{t.path}</span></span>
                      </div>
                      <ScrollPre aria-label={`Input schema of ${t.name}`} className="tool-card-schema">{t.inputSchema}</ScrollPre>
                    </div>
                  ))}
                </div>
                <div className="agent-card-block">
                  <SectionLabel as="h3">MCP client config</SectionLabel>
                  <ScrollPre aria-label="MCP client config" className="agent-card-config">{det.mcp.clientConfig}</ScrollPre>
                  <span className="agent-card-foot">Tested with MCP Inspector, Claude, Postman and Cherry Studio.</span>
                </div>
              </section>
            ) : (
              <Callout tone="info" title="Not exposed to agents">This service is not published as MCP tools.</Callout>
            )}
          </div>
        </TabPanel>

        <TabPanel id="tests" idPrefix="svc" value={tabId}>
          <section aria-labelledby="runs-title" className="service-card runs-card">
            <div className="runs-card-head">
              <div className="runs-card-title">
                <h2 id="runs-title">Latest test runs</h2>
                {latestRun ? <span><span className="ex-mono">{latestRun.runner}</span> against <span className="ex-mono">{latestRun.endpoint}</span></span> : null}
              </div>
              <div className="runs-card-actions">
                <Button asChild variant="secondary" className="runs-card-all"><RouterLink to={`/tests/service/${svc.id}`}>All runs</RouterLink></Button>
                <Button asChild variant="primary" icon="plus" className="runs-card-new"><RouterLink to={`/tests/create?service=${svc.id}`}>New test</RouterLink></Button>
              </div>
            </div>
            {runs.data && runs.data.length === 0 ? <p>No test run yet. Run a first test to get a conformance score.</p> : null}
            {recentRuns.length ? (
              <ul className="run-list">
                {recentRuns.map((r) => {
                  const tone = r.result === 'passed' ? 'passed' : r.result === 'running' ? 'running' : 'failed';
                  return (
                    <li key={r.id}>
                      <RouterLink to={`/tests/runner/${r.id}`} className="run-list-row">
                        <span className="run-list-id">#{r.id}</span>
                        <span className="run-list-status" data-tone={tone}>
                          <Icon name={tone === 'passed' ? 'check-circle' : tone === 'running' ? 'running' : 'x-circle'} size={14} />
                          {tone === 'passed' ? 'Passed' : tone === 'running' ? 'Running' : 'Failed'}
                        </span>
                        <span className="run-list-score">{r.passed}/{r.total}</span>
                        <Chip size="sm" className="run-list-env">{r.environment}</Chip>
                        <span className="run-list-when">{relative(r.startedAt)}</span>
                        <Icon name="chevron" size={14} className="run-list-chevron" />
                      </RouterLink>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        </TabPanel>
      </Tabs>
    </div>
  );
}

/** One route for every service: an A2A agent gets its own screen (18), the others the service screen (05). */
export default function ServicePage() {
  const { serviceId = '' } = useParams();
  const uc = useUseCases();
  const service = useQuery(() => uc.catalog.getService(serviceId), [uc, serviceId]);
  if (service.data?.protocol === 'A2A') return <AgentPage />;
  if (!service.data && service.status === 'loading') {
    return (
      <>
        <PageHeader title="Service" />
        <LoadingBlock label="the service" />
      </>
    );
  }
  return <ApiServicePage />;
}
