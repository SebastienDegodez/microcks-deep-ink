import '../explore-kit/explore.css';
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router';
import { formatDay } from '@/domain/importing';
import { buildSnippet, exampleUrlPath, paramLines, requestHead, type SnippetFormat, type WorkflowUsage } from '@/domain/catalog';
import { labelToString, type Example, type Operation } from '@/domain/shared';
import { PageHeader, useAnnounce, useQuery, useRelativeTime, useUseCases, usePageTitle } from '@/ui/app';
import { AiGhostRow } from '@/ui/components/ui/ai-ghost-row';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { DescriptionList } from '@/ui/components/ui/description-list';
import { Icon } from '@/ui/components/ui/icon';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { Menu } from '@/ui/components/ui/menu';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { MockUrl } from '@/ui/components/ui/mock-url';
import { Panel } from '@/ui/components/ui/panel';
import { Segmented } from '@/ui/components/ui/segmented';
import { StatusBadge } from '@/ui/components/ui/status-badge';
import { TabPanel, Tabs } from '@/ui/components/ui/tabs';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';
import { fmt, pluralize } from '../explore-kit/format';

type TabId = 'operations' | 'properties' | 'tests';
const TAB_IDS: TabId[] = ['operations', 'properties', 'tests'];

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const days = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
  return (
    <div>
      <div className="ex-sparkbars" style={{ height: 32 }} role="img" aria-label={`Calls per day over 7 days: ${values.join(', ')}`}>
        {values.map((v, i) => <span key={i} style={{ height: `${Math.max(6, Math.round((v / max) * 100))}%` }} title={`${days[i % 7]}: ${v}`} />)}
      </div>
    </div>
  );
}

function WorkflowResult({ usage }: { usage: WorkflowUsage }) {
  const r = usage.result;
  if (!r || r.kind === 'never') return <span className="ex-small ex-secondary"><Icon name="circle" size={12} /> never run</span>;
  if (r.kind === 'blocked') return <span className="ex-small ex-secondary"><Icon name="warning" size={12} /> blocked · {r.reason}</span>;
  return (
    <RouterLink to={`/workflows/runs/${r.runId}`} className="ex-small">
      <Icon name={r.kind === 'passed' ? 'check' : 'cross'} size={12} /> {r.kind === 'passed' ? 'Passed' : 'Failed'} · run #{r.runNumber} on {r.target}
    </RouterLink>
  );
}

export default function ServicePage() {
  const { serviceId = '', tab } = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const uc = useUseCases();
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
  const examples = useQuery(() => (currentOp ? uc.catalog.listExamples(serviceId, currentOp.id) : Promise.resolve([] as Example[])), [uc, serviceId, currentOp?.id]);
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

  const list = examples.data ?? [];
  const pending = list.filter((e) => e.reviewState === 'pending');
  const accepted = list.filter((e) => e.reviewState !== 'pending');
  const selected = list.find((e) => e.id === search.get('example')) ?? accepted[0] ?? list[0];
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
  const opUsages = (usages.data ?? []).filter((u) => (u.steps ?? []).some((s) => s.catalogOperationId === currentOp?.id));
  const failed = svc.testStatus === 'failed';

  const accept = async (e: Example) => {
    if (!currentOp) return;
    await uc.copilot.accept(serviceId, currentOp.id, e);
    announce(`Accepted ${e.name}. The mock serves it now.`);
    examples.reload();
  };
  const reject = async (e: Example) => {
    if (!currentOp) return;
    await uc.catalog.removeExample(serviceId, currentOp.id, e.id);
    setRejected(e);
    announce(`Rejected ${e.name}.`);
    examples.reload();
  };
  const undo = async () => {
    if (!currentOp || !rejected) return;
    await uc.catalog.addExamples(serviceId, currentOp.id, [rejected]);
    setRejected(undefined);
    announce('Proposal restored.');
    examples.reload();
  };

  const header = (
    <>
      <PageHeader
        title={`${svc.name} ${svc.version}`}
        eyebrow={<span role="group" aria-label="Breadcrumb"><RouterLink to="/services">APIs &amp; Services</RouterLink> / <span aria-current="page">{svc.name} {svc.version}</span></span>}
        badge={<ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} />}
        actions={
          <>
            <Button asChild icon="play"><RouterLink to={`/tests/create?service=${svc.id}`}>Run a test</RouterLink></Button>
            <Button asChild variant="secondary" icon="spark"><RouterLink to={`/services/${svc.id}/copilot${currentOp ? `?op=${currentOp.id}` : ''}`}>Generate examples (AI)</RouterLink></Button>
            <Menu
              label="More actions"
              icon="more"
              iconOnly
              variant="secondary"
              align="end"
              items={[
                { id: 'labels', label: 'Edit labels', onSelect: () => announce('Edit labels is not part of this demo.') },
                { id: 'docs', label: 'View OpenAPI documentation', onSelect: () => announce('Documentation opens in the real product.') },
                { id: 'download', label: 'Download contract', onSelect: () => announce('Contract download is not part of this demo.') },
                { id: 'delete', label: 'Delete Service', danger: true, onSelect: () => announce('Delete is disabled in the demo.') },
              ]}
            />
          </>
        }
      />
      <div className="ex-stack" style={{ gap: 8 }}>
        <p className="ex-row ex-secondary" style={{ margin: 0 }}>
          <LiveIndicator label={`mock live · last call ${relative(det.lastCallAt)}`} />
        </p>
        <p style={{ margin: 0 }}>{det.description}</p>
        <div className="ex-row">
          {svc.labels.map((l) => <Chip key={labelToString(l)} variant="outline">{labelToString(l)}</Chip>)}
          <span className="ex-small ex-muted">{det.createdLabel} · imported {formatDay(det.importedAt)}</span>
        </div>
        <div className="ex-row">
          <ApiBadge label="conformance" value={svc.conformance === null ? 'untested' : `${svc.conformance}%`} status={svc.conformance === null ? 'neutral' : failed ? 'danger' : 'success'} size="sm" />
          <ApiBadge label="mcp" value={svc.mcp ? 'agent-ready' : 'not exposed'} status={svc.mcp ? 'info' : 'neutral'} size="sm" />
          <ApiBadge label="samples" value={String(svc.exampleCount ?? 0)} size="sm" />
          {pending.length > 0 ? <ApiBadge label="" value={`+${pending.length} AI`} status="info" size="sm" /> : null}
        </div>
      </div>
    </>
  );

  return (
    <div className="ex-stack">
      {header}
      <Tabs
        label="Service sections"
        idPrefix="svc"
        value={tabId}
        onChange={goTab}
        items={[
          { id: 'operations', label: 'Operations', count: ops.data?.length },
          { id: 'properties', label: 'Properties & MCP' },
          { id: 'tests', label: 'Tests', count: runs.data?.length },
        ]}
      >
        <TabPanel id="operations" idPrefix="svc" value={tabId}>
          <div className="ex-grid ex-ops-layout">
              <div className="ex-stack">
                <p className="ex-row-between ex-small ex-secondary" style={{ margin: 0 }}><span>{pluralize(ops.data?.length ?? 0, 'operation')}</span><span>calls · 7 d</span></p>
                <ul className="ex-plain-list" aria-label={`Operations of ${svc.name} ${svc.version}`}>
                  {(ops.data ?? []).map((o) => (
                    <li key={o.id}>
                      <Button
                        variant={o.id === currentOp?.id ? 'secondary' : 'ghost'}
                        aria-pressed={o.id === currentOp?.id}
                        onClick={() => select({ op: o.id, example: undefined })}
                        style={{ width: '100%', justifyContent: 'flex-start', height: 'auto', padding: 8 }}
                      >
                        <span className="ex-stack" style={{ gap: 2, textAlign: 'start' }}>
                          <span className="ex-row"><MethodTag method={o.method} protocol={svc.protocol} /> <span className="ex-mono">{o.path}</span></span>
                          <span className="ex-small ex-secondary">{o.summary} · {fmt(o.calls)} calls</span>
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
                <p className="ex-small ex-secondary">Every operation is served as soon as the contract is imported. No code, no deployment.</p>
              </div>
              {currentOp ? (
                <section aria-label="Operation detail" className="ex-stack">
                  <div className="ex-row-between">
                    <div className="ex-stack" style={{ gap: 2 }}>
                      <div className="ex-row"><MethodTag method={currentOp.method} protocol={svc.protocol} /><h2 className="ex-mono" style={{ margin: 0, fontSize: 'var(--type-heading)' }}>{currentOp.path}</h2></div>
                      <span className="ex-small ex-secondary">{currentOp.summary}{currentOp.mcpTool ? <> · MCP tool <code>{currentOp.mcpTool}</code></> : null}</span>
                    </div>
                    <div><span className="ex-small ex-secondary">Calls · 7 days</span> <strong>{fmt(currentOp.calls)}</strong><Sparkline values={currentOp.spark} /></div>
                  </div>

                  <MockUrl url={mockUrl} method={currentOp.method} mcpTool={currentOp.mcpTool} bare />
                  {spec ? (
                    <div className="ex-stack" style={{ gap: 8 }}>
                      <Segmented label="Call format" value={format} onChange={(id) => setFormat(id as SnippetFormat)} options={[{ id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }, ...(currentOp.mcpTool ? [{ id: 'mcp', label: 'MCP tool' }] : [])]} />
                      <CodeBlock code={buildSnippet(format, spec)} caption="Call snippet" language="shell" copy />
                    </div>
                  ) : null}

                  <p className="ex-row ex-small" style={{ margin: 0 }}>
                    <span><span className="ex-secondary">Dispatcher</span> <strong>{currentOp.dispatcher}</strong> <span className="ex-mono">{currentOp.rule}</span></span>
                    <span><span className="ex-secondary">Delay</span> <strong>{currentOp.delayMs} ms</strong> fixed</span>
                    <RouterLink to={`/services/${svc.id}/operations/${currentOp.id}`}>Edit behavior</RouterLink>
                  </p>

                  <div role="group" aria-labelledby="wf-used-title" className="ex-stack" style={{ gap: 4 }}>
                    <div className="ex-row-between">
                      <h3 id="wf-used-title" style={{ margin: 0 }}>Used in {pluralize(opUsages.length, 'workflow')}</h3>
                      <RouterLink to="/workflows">All workflows</RouterLink>
                    </div>
                    <span className="ex-small ex-secondary"><code>{currentOp.method} {currentOp.path}</code> is called by these workflow steps.</span>
                    <ul className="ex-plain-list">
                      {opUsages.map((u) => (
                        <li key={`${u.documentId}/${u.workflowId}`} className="ex-row-between">
                          <span className="ex-row">
                            <RouterLink to={`/workflows/${u.documentId}/${u.workflowId}`}>{u.workflowId}</RouterLink>
                            {(u.steps ?? []).filter((s) => s.catalogOperationId === currentOp.id).map((s) => <Chip key={s.stepId} variant="outline">{s.stepId}</Chip>)}
                          </span>
                          <WorkflowResult usage={u} />
                        </li>
                      ))}
                      {opUsages.length === 0 ? <li className="ex-small ex-muted">No workflow calls this operation.</li> : null}
                    </ul>
                  </div>

                  <div className="ex-stack" aria-busy={examples.status === 'loading'}>
                    <div className="ex-row-between"><h3 style={{ margin: 0 }}>Examples</h3><span className="ex-small ex-secondary">{accepted.length} served{pending.length ? ` · ${pending.length} to review` : ''}</span></div>
                    <ul className="ex-plain-list" aria-label="Examples of the operation">
                      {accepted.map((e) => (
                        <li key={e.id}>
                          <Button variant={e.id === selected?.id ? 'secondary' : 'ghost'} aria-pressed={e.id === selected?.id} onClick={() => select({ example: e.id })} style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <span className="ex-row"><Chip tone="success">{e.response.status}</Chip> <strong>{e.name}</strong> <span className="ex-small ex-secondary">{Object.values(e.request.params).join(' · ') || 'no parameter'}</span>{e.aiGenerated ? <Chip tone="info">AI example accepted</Chip> : null}</span>
                          </Button>
                        </li>
                      ))}
                      {pending.map((e) => (
                        <li key={e.id}>
                          <AiGhostRow name={e.name} onAccept={() => void accept(e)} onReject={() => void reject(e)} onEdit={() => navigate(`/services/${svc.id}/copilot?op=${currentOp.id}`)}>
                            {e.name} · {e.response.status} — generated by AI, review needed
                          </AiGhostRow>
                        </li>
                      ))}
                    </ul>
                    {rejected ? <Callout tone="info" live="polite" actions={<Button size="sm" variant="secondary" onClick={() => void undo()}>Undo</Button>}>AI proposal rejected.</Callout> : null}
                    {selected && spec ? (
                      <div className="ex-grid ex-grid-2-even">
                        {selected.reviewState === 'pending' ? <div role="note" className="ex-small" style={{ gridColumn: '1 / -1' }}>Proposed by AI from the contract's schema. The mock only serves it once accepted.</div> : null}
                        <Panel title="Request" headingLevel={4} actions={<span className="ex-small ex-secondary">{selected.name}</span>}>
                          <CodeBlock code={requestHead(spec)} language="http" caption="Request line and headers" />
                          {Object.keys(selected.request.params).length ? <CodeBlock code={paramLines(spec.pathTemplate, selected.request.params)} caption="Parameters" /> : null}
                          {selected.request.body ? <CodeBlock code={selected.request.body} language="json" caption="Request body" /> : null}
                        </Panel>
                        <Panel title="Response" headingLevel={4} actions={<span className="ex-small ex-secondary">{selected.response.status}</span>}>
                          <CodeBlock code={'Content-Type: application/json'} caption="Response headers" />
                          <CodeBlock code={selected.response.body} language="json" caption="Response body" copy />
                        </Panel>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}
          </div>
        </TabPanel>

        <TabPanel id="properties" idPrefix="svc" value={tabId}>
          <div className="ex-stack">
            <Panel title="Properties">
              <DescriptionList
                items={[
                  { term: 'Version', value: svc.version },
                  { term: 'Type', value: <span className="ex-row"><ApiBadge protocol={svc.protocol} size="sm" /> {svc.format}</span> },
                  ...det.artifacts.map((a) => ({ term: a.role === 'primary' ? 'Primary artifact' : 'Secondary artifact', value: <span><code>{a.file}</code><br /><span className="ex-small ex-secondary">{a.kind} · {a.summary}</span></span> })),
                  { term: 'Last import', value: <span>{formatDay(det.importedAt)} · {relative(det.importedAt)}<br /><span className="ex-small ex-secondary">{det.lastImportSummary}</span></span> },
                  { term: 'Created', value: formatDay(det.createdAt) },
                  { term: 'Statistics', value: <span>{fmt(det.calls7d)} calls over 7 days · <RouterLink to="/usage">Usage details</RouterLink></span> },
                ]}
              />
            </Panel>
            {det.mcp ? (
              <Panel title="Agent-ready" actions={<span className="ex-row"><ApiBadge label="mcp" value={pluralize(det.mcp.tools.length, 'tool')} status="info" size="sm" /><CopyButton value={det.mcp.clientConfig} label="Copy client config" /></span>}>
                <p>Every mock operation is published as an MCP tool. An AI agent discovers it via <code>tools/list</code> and calls it with arguments derived from the contract's schemas: path, query and body grouped under <code>params.arguments</code>.</p>
                <h3>Endpoints</h3>
                <ul className="ex-plain-list">
                  <li className="ex-row"><strong>HTTP SSE</strong> <span className="ex-small ex-secondary">MCP 2024-11-05</span> <code className="ex-url-line">{det.mcp.sseUrl}</code> <CopyButton value={det.mcp.sseUrl} label="Copy SSE URL" /></li>
                  <li className="ex-row"><strong>Streamable HTTP</strong> <span className="ex-small ex-secondary">MCP 2025-03-26</span> <code className="ex-url-line">{det.mcp.httpUrl}</code> <CopyButton value={det.mcp.httpUrl} label="Copy HTTP URL" /></li>
                </ul>
                <h3>Exposed tools, as an agent sees them</h3>
                {det.mcp.tools.map((t) => (
                  <div key={t.name} className="ex-stack" style={{ gap: 4 }}>
                    <span className="ex-row"><strong className="ex-mono">{t.name}</strong><MethodTag method={t.method} protocol={svc.protocol} /><code>{t.path}</code></span>
                    <span className="ex-small ex-secondary">{t.description}</span>
                    <CodeBlock code={t.inputSchema} language="json" caption={`Input schema of ${t.name}`} />
                  </div>
                ))}
                <h3>MCP client config</h3>
                <CodeBlock code={det.mcp.clientConfig} language="json" caption="MCP client config" copy />
                <p className="ex-small ex-secondary">Tested with MCP Inspector, Claude, Postman and Cherry Studio.</p>
              </Panel>
            ) : (
              <Callout tone="info" title="Not exposed to agents">This service is not published as MCP tools.</Callout>
            )}
          </div>
        </TabPanel>

        <TabPanel id="tests" idPrefix="svc" value={tabId}>
          <Panel
            title="Latest test runs"
            actions={<span className="ex-row"><RouterLink to={`/tests/service/${svc.id}`}>All runs</RouterLink><Button asChild size="sm" variant="secondary" icon="plus"><RouterLink to={`/tests/create?service=${svc.id}`}>New test</RouterLink></Button></span>}
          >
            {runs.data && runs.data.length === 0 ? <p>No test run yet. Run a first test to get a conformance score.</p> : null}
            <ul className="ex-plain-list">
              {(runs.data ?? []).slice(0, 5).map((r) => (
                <li key={r.id}>
                  <RouterLink to={`/tests/runner/${r.id}`} className="ex-row">
                    <strong>#{r.id}</strong>
                    <StatusBadge size="sm" status={r.result === 'passed' ? 'conformant' : r.result === 'running' ? 'running' : 'failed'} />
                    <span className="ex-small">{r.passed}/{r.total} steps</span>
                    <span className="ex-small ex-secondary">{r.runner} · {r.environment} · {relative(r.startedAt)}</span>
                  </RouterLink>
                </li>
              ))}
            </ul>
          </Panel>
        </TabPanel>
      </Tabs>
    </div>
  );
}
