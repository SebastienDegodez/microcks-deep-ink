<script lang="ts">
  import { formatDay, formatHourMinute } from '@microcks/demo-core/domain/importing';
  import { buildSnippet, exampleUrl, paramLines, requestHead, type SnippetFormat, type WorkflowUsage } from '@microcks/demo-core/domain/catalog';
  import { labelToString, type Example } from '@microcks/demo-core/domain/shared';
  import { ApiBadge, Callout, Chip, CodeBlock, CopyButton, Exchange, ExchangeCard, FactRow, Facts, Icon, Input, LiveIndicator, Menu, MethodTag, OpPickList, SectionLabel, SummaryStrip, SummaryStripSep, SplitPane, SplitPaneMain, SplitPaneSide, TabPanel, Tabs } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useAnnounce, useClock, useNavigate, usePageTitle, useParams, useQuery, useRelativeTime, useSearchParams, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { fmt, pluralize } from '@/ui/app/format';
  import Sparkline from './Sparkline.svelte';
  import { RECENT_RUNS, exampleSub, exampleView, examplesLabel, examplesMeta, pendingCount, pickOperation, runTone, schemaNameOf, snippetSpec, stepRefsOf, tabOf, workflowResult } from './overview';

  /** The service screen (05): operations with their mock and examples, properties and MCP tools, latest test runs. */
  const params = useParams();
  // A stable proxy that follows the URL, and its setter: safe to destructure.
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const uc = useUseCases();
  const clock = useClock();
  const relative = useRelativeTime();
  const announce = useAnnounce();
  const serviceId = $derived(params.serviceId ?? '');
  const tabId = $derived(tabOf(params.tab));
  let format = $state<SnippetFormat>('curl');
  let rejected = $state.raw<Example | undefined>();

  const service = useQuery(() => uc.catalog.getService(serviceId), () => [uc, serviceId]);
  const details = useQuery(() => uc.catalog.getServiceDetails(serviceId), () => [uc, serviceId]);
  const ops = useQuery(() => uc.catalog.listOperations(serviceId), () => [uc, serviceId]);
  const usages = useQuery(() => uc.catalog.workflowUsages(serviceId), () => [uc, serviceId]);
  const runs = useQuery(() => uc.testing.listForService(serviceId), () => [uc, serviceId]);
  const currentOp = $derived(pickOperation(ops.data, search.get('op')));
  // Examples of every operation: the rail shows each operation's count and its pending AI proposal.
  const allExamples = useQuery(
    () => Promise.all((ops.data ?? []).map(async (o) => [o.id, await uc.catalog.listExamples(serviceId, o.id)] as const)).then((rows) => Object.fromEntries(rows) as Record<string, Example[]>),
    () => [uc, serviceId, ops.data],
  );
  usePageTitle(() => (service.data ? `${service.data.name} ${service.data.version} · Microcks` : 'Service · Microcks'));

  const svc = $derived(service.data);
  const det = $derived(details.data);
  const list = $derived((currentOp && allExamples.data?.[currentOp.id]) || []);
  const { pending, fromContract, aiAccepted, ordered, selected } = $derived(exampleView(list, search.get('example')));
  const pendingTotal = $derived(pendingCount(allExamples.data));
  const select = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) next.delete(k);
      else next.set(k, v);
    }
    setSearch(next, { replace: true });
  };
  const goTab = (id: string) => navigate({ pathname: `/services/${serviceId}/${id}`, search: search.toString() });

  const spec = $derived(det ? snippetSpec(currentOp, selected, det) : undefined);
  const mockUrl = $derived(spec ? exampleUrl(spec) : (det?.mockBase ?? ''));
  const allUsages = $derived(usages.data ?? []);
  const stepRefs = $derived(stepRefsOf(allUsages, currentOp?.id));
  const recentRuns = $derived((runs.data ?? []).slice(0, RECENT_RUNS));
  const latestRun = $derived(runs.data?.[0]);
  const schemaName = $derived(svc ? schemaNameOf(svc.name) : '');

  const accept = async (e: Example) => {
    if (!currentOp) return;
    await uc.copilot.accept(serviceId, currentOp.id, e);
    announce(`Accepted ${e.name}. The mock serves it now.`);
    allExamples.reload();
  };
  const reject = async (e: Example) => {
    if (!currentOp) return;
    const wasSelected = selected?.id === e.id;
    await uc.catalog.removeExample(serviceId, currentOp.id, e.id);
    rejected = e;
    if (wasSelected) select({ example: undefined });
    announce(`Rejected ${e.name}.`);
    allExamples.reload();
  };
  const undo = async () => {
    if (!currentOp || !rejected) return;
    await uc.catalog.addExamples(serviceId, currentOp.id, [rejected]);
    rejected = undefined;
    announce('Proposal restored.');
    allExamples.reload();
  };
</script>

{#snippet scrollPre(label: string, cssClass: string, text: string)}<!--
    A `<pre>` that may scroll sideways. The scroll container must be keyboard reachable (WCAG 2.1.1), so it is
    focusable and named, like the registry's code-block.
  --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><pre
    tabindex="0"
    role="region"
    aria-label={label}
    class={cssClass}>{text}</pre
  >{/snippet}

{#snippet workflowResultOf(usage: WorkflowUsage)}{@const result = workflowResult(usage, relative)}<span class="wf-usage-result" data-tone={result.tone}
    ><Icon name={result.icon} size={13} stroke-width={2.2} />{result.text}</span
  >{/snippet}

{#if service.status === 'error' && !service.data}<PageHeader title="Service" /><ErrorBlock
    error={service.error}
    what="The service"
    onretry={service.reload}
  />{:else if !svc || !det}<PageHeader title="Service" /><LoadingBlock label="the service" />{:else}
  {#snippet title()}<ApiBadge protocol={svc.protocol} name={`${svc.name} ${svc.version}`} size="xl" />{/snippet}
  {#snippet badge()}<LiveIndicator label={`mock live · last call ${relative(det.lastCallAt)}`} />{/snippet}
  {#snippet actions()}<ButtonRouterLink variant="primary" icon="play" to={`/tests/create?service=${svc.id}`}>Run a test</ButtonRouterLink
    ><ButtonRouterLink variant="secondary" icon="spark" class="service-ai-action" to={`/services/${svc.id}/copilot${currentOp ? `?op=${currentOp.id}` : ''}`}
      >Generate examples (AI)</ButtonRouterLink
    ><Menu
      label="More actions"
      icon="more-vertical"
      iconOnly
      variant="secondary"
      align="end"
      items={[
        { id: 'labels', label: 'Edit labels', onselect: () => announce('Edit labels is not part of this demo.') },
        { id: 'docs', label: 'View OpenAPI documentation', onselect: () => announce('Documentation opens in the real product.') },
        { id: 'download', label: 'Download contract', onselect: () => announce('Contract download is not part of this demo.') },
        { id: 'delete', label: 'Delete Service', danger: true, separatorBefore: true, onselect: () => announce('Delete is disabled in the demo.') },
      ]}
    />{/snippet}
  <div class="ex-stack service-page"
    ><PageHeader
      variant="badge"
      align="start"
      {title}
      breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${svc.name} ${svc.version}` }]}
      breadcrumbSeparator="/"
      {badge}
      description={det.description}
      descriptionTone="secondary"
      {actions}
      ><div class="service-head-row"
        >{#each svc.labels as l (labelToString(l))}<Chip variant="outline">{labelToString(l)}</Chip>{/each}<span class="service-head-dates"
          >Created <!---->{det.createdLabel}<!----> · imported <!---->{formatDay(det.importedAt)}<!----> at <!---->{formatHourMinute(det.importedAt)}</span
        ></div
      ><div class="service-head-proofs"
        ><ApiBadge
          label="conformance"
          value={svc.conformance === null ? 'untested' : `${svc.conformance}%`}
          status={svc.conformance === null ? 'neutral' : svc.conformance >= 90 ? 'success' : svc.conformance >= 60 ? 'warning' : 'danger'}
        /><ApiBadge label="mcp" value={svc.mcp ? 'agent-ready' : 'not exposed'} status={svc.mcp ? 'info' : 'neutral'} /><ApiBadge
          label="samples"
          value={String(svc.exampleCount ?? 0)}
          status="action"
          values={pendingTotal > 0 ? [{ value: `+${pendingTotal} AI`, status: 'warning' }] : undefined}
          class="service-samples"
        /></div
      ></PageHeader
    ><Tabs
      label="Service sections"
      idPrefix="svc"
      value={tabId}
      onchange={goTab}
      items={[
        { id: 'operations', label: 'Operations', count: ops.data?.length },
        { id: 'properties', label: 'Properties & MCP' },
        { id: 'tests', label: 'Tests', count: runs.data ? recentRuns.length : undefined },
      ]}
      ><TabPanel id="operations" idPrefix="svc" value={tabId}
        ><SplitPane sideMax="360px" keepSideMax
          ><SplitPaneSide class="op-rail"
            ><SectionLabel as="p" size="sm" weight="regular" split class="op-rail-head"
              ><span>{pluralize(ops.data?.length ?? 0, 'operation')}</span><span>calls · 7 d</span></SectionLabel
            ><OpPickList
              label={`Operations of ${svc.name} ${svc.version}`}
              value={currentOp?.id}
              onchange={(id) => select({ op: id, example: undefined })}
              options={(ops.data ?? []).map((o) => ({
                id: o.id,
                method: o.method,
                protocol: svc.protocol,
                path: o.path,
                summary: o.summary,
                meta: allExamples.data ? examplesMeta(allExamples.data[o.id] ?? []) : undefined,
                end: fmt(o.calls),
                endLabel: 'Calls over 7 days: ',
              }))}
            /><p class="op-rail-note">Every operation is served as soon as the contract is imported. No code, no deployment.</p></SplitPaneSide
          >{#if currentOp}<SplitPaneMain as="section" aria-label="Operation detail" class="op-detail"
              ><div class="op-detail-head"
                ><div class="op-detail-title"
                  ><div class="op-detail-title-row"
                    ><MethodTag method={currentOp.method} protocol={svc.protocol} class="op-detail-method" /><h2>{currentOp.path}</h2></div
                  ><span class="op-detail-summary"
                    >{currentOp.summary}{#if currentOp.mcpTool}{' · MCP tool '}<span class="op-detail-tool">{currentOp.mcpTool}</span>{/if}</span
                  ></div
                ><Sparkline values={currentOp.spark} total={currentOp.calls} today={clock.now()} /></div
              ><div class="op-mock"
                ><SectionLabel as="label" htmlFor="mock-url">Mock URL</SectionLabel
                ><div class="op-mock-url"
                  ><Input id="mock-url" mono readonly value={mockUrl} class="op-mock-url-input" /><CopyButton value={mockUrl} size="md" label="Copy" /></div
                >{#if spec}<CodeBlock
                    code={buildSnippet(format, spec)}
                    language="shell"
                    tabsLabel="Call format"
                    tabs={[{ id: 'curl', label: 'curl' }, { id: 'httpie', label: 'HTTPie' }, ...(currentOp.mcpTool ? [{ id: 'mcp', label: 'MCP tool call' }] : [])]}
                    tab={format}
                    ontabchange={(id) => (format = id as SnippetFormat)}
                    copy
                  />{/if}</div
              ><SummaryStrip gap="roomy" lineHeight="inherit"
                ><span class="dispatch-strip-item"
                  ><span class="dispatch-strip-key">Dispatcher</span><span class="dispatch-strip-value"
                    >{currentOp.dispatcher}<!----> · rule: <!---->{currentOp.rule}</span
                  ></span
                ><SummaryStripSep /><span class="dispatch-strip-item"
                  ><span class="dispatch-strip-key">Delay</span><span class="dispatch-strip-value">{currentOp.delayMs}<!----> ms</span><span
                    class="dispatch-strip-key">fixed</span
                  ></span
                ><ButtonRouterLink
                  size="sm"
                  variant="secondary"
                  icon="pencil"
                  class="dispatch-strip-edit"
                  to={`/services/${svc.id}/operations/${currentOp.id}`}>Edit behavior</ButtonRouterLink
                ></SummaryStrip
              ><div role="group" aria-labelledby="wf-used-title" class="wf-usage"
                ><div class="wf-usage-head"
                  ><h3 id="wf-used-title"><Icon name="dispatcher" size={15} />Used in <!---->{pluralize(allUsages.length, 'workflow')}</h3
                  ><RouterLink to="/workflows">All workflows</RouterLink></div
                ><span class="wf-usage-line"
                  ><span class="wf-usage-op">{currentOp.method}<!---->{' '}<!---->{currentOp.path}</span>{' '}<!---->{stepRefs.length === 0
                    ? 'is not called by any workflow step.'
                    : `is called by ${pluralize(stepRefs.length, 'workflow step')}: ${stepRefs.map((s) => s.ref).join(', ')} (operationId ${stepRefs[0]?.operationId}).`}</span
                ><ul class="wf-usage-list"
                  >{#each allUsages as u (`${u.documentId}/${u.workflowId}`)}<li
                      ><RouterLink to={`/workflows/${u.documentId}/${u.workflowId}`} class="wf-usage-name">{u.summary}</RouterLink
                      ><span class="wf-usage-steps"
                        >{#each u.steps ?? [] as s (s.stepId)}{@const on = s.catalogOperationId === currentOp.id}<span
                            class="wf-usage-step"
                            data-on={on ? '' : undefined}
                            title={`operationId: ${s.operationId}${on ? ' · calls this operation' : ''}`}
                            >{s.stepId}<span class="sr-only">{' (operationId '}<!---->{s.operationId}{#if on}, calls this operation{/if})</span></span
                          >{/each}</span
                      >{@render workflowResultOf(u)}</li
                    >{/each}{#if allUsages.length === 0}<li class="wf-usage-empty">No workflow calls this service.</li>{/if}</ul
                ></div
              ><div class="op-examples" aria-busy={allExamples.status === 'loading'}
                ><div class="op-examples-head"
                  ><h3>Examples</h3><span
                    >{examplesLabel(fromContract.length)}<!----> from the contract{#if pending.length}{` · ${pluralize(pending.length, 'AI proposal')} pending`}{/if}{#if aiAccepted.length}{` · ${pluralize(aiAccepted.length, 'AI example')} accepted`}{/if}</span
                  ></div
                ><SplitPane sideWidth="220px" sideMax="300px" mainWidth="420px" gap="16px" keepSideMax
                  ><SplitPaneSide class="example-col"
                    ><ul class="example-list" aria-label="Examples of the operation"
                      >{#each ordered as e (e.id)}{@const ghost = e.reviewState === 'pending'}<li
                          class="example-pick"
                          data-ghost={ghost ? '' : undefined}
                          data-selected={e.id === selected?.id ? '' : undefined}
                          ><button type="button" aria-pressed={e.id === selected?.id} onclick={() => select({ example: e.id })}
                            ><span class="example-pick-status">{e.response.status}</span><span class="example-pick-main"
                              ><span class="example-pick-name">{e.name}</span><span class="example-pick-sub">{exampleSub(e)}</span></span
                            ></button
                          >{#if ghost}<div class="example-pick-review"
                              ><span class="example-pick-review-note"><Icon name="spark" size={13} />Generated by AI, review needed</span><span
                                class="example-pick-review-actions"
                                ><button type="button" class="example-pick-accept" aria-label={`Accept ${e.name}`} onclick={() => void accept(e)}>Accept</button
                                ><button type="button" class="example-pick-reject" aria-label={`Reject ${e.name}`} onclick={() => void reject(e)}>Reject</button
                                ></span
                              ></div
                            >{:else if e.aiGenerated}<div class="example-pick-accepted"><Icon name="check" size={13} />AI example accepted by MA</div>{/if}</li
                        >{/each}</ul
                    >{#if rejected}<div class="example-rejected" role="status"
                        >AI proposal rejected.<button type="button" onclick={() => void undo()}>Undo</button></div
                      >{/if}</SplitPaneSide
                  >{#if selected && spec}{#snippet request()}<ExchangeCard
                        title="Request"
                        label={`Request of ${selected.name}`}
                        meta={selected.name}
                        headingLevel="none"
                        blocks={[
                          { label: 'Request line and headers', text: requestHead(spec), tone: 'secondary' },
                          ...(Object.keys(selected.request.params).length ? [{ label: 'Parameters', text: paramLines(spec.pathTemplate, selected.request.params), tone: 'params' as const }] : []),
                          ...(selected.request.body ? [{ label: 'Request body', text: selected.request.body }] : []),
                        ]}
                      />{/snippet}{#snippet response()}<ExchangeCard
                        title="Response"
                        label={`Response of ${selected.name}`}
                        status={`${selected.response.status}${selected.response.status === 200 ? ' OK' : ''}`}
                        headingLevel="none"
                        blocks={[
                          { label: 'Response headers', text: `Content-Type: application/json\nContent-Length: ${selected.response.body.length}`, tone: 'headers' },
                          { label: 'Response body', text: selected.response.body, grow: true },
                        ]}
                      />{/snippet}<SplitPaneMain class="example-detail"
                      >{#if selected.reviewState === 'pending'}<Callout tone="ai" variant="outline" title=""
                          >Proposed by AI from the contract's <span class="demo-mono">{schemaName}</span> schema. The mock only serves it once accepted.</Callout
                        >{/if}<Exchange children={[request, response]} /></SplitPaneMain
                    >{/if}</SplitPane
                ></div
              ></SplitPaneMain
            >{/if}</SplitPane
        ></TabPanel
      ><TabPanel id="properties" idPrefix="svc" value={tabId}
        ><div class="service-props"
          ><section aria-labelledby="props-title" class="service-card props-card"
            ><h2 id="props-title">Properties</h2><Facts size="lg" termWidth="150px"
              ><FactRow term="Version" mono>{svc.version}</FactRow
              ><FactRow term="Type"
                ><span class="facts-inline"
                  ><MethodTag method={svc.protocol} protocol={svc.protocol} class="facts-proto" /><span class="ex-secondary">{svc.format}</span></span
                ></FactRow
              >{#each det.artifacts as a (a.file)}{#snippet sub()}<span class="facts-kind">{a.kind}<!----> · <!---->{a.summary}</span>{/snippet}<FactRow
                  term={a.role === 'primary' ? 'Primary artifact' : 'Secondary artifact'}
                  {sub}><span class="facts-file">{a.file}</span></FactRow
                >{/each}<FactRow term="Last import" sub={det.lastImportSummary}
                >{formatDay(det.importedAt)}<!----> at <!---->{formatHourMinute(det.importedAt)}<!----> · <!---->{relative(det.importedAt)}</FactRow
              ><FactRow term="Created">{formatDay(det.createdAt)}</FactRow
              ><FactRow term="Statistics"
                ><span class="facts-inline ex-secondary"
                  >{fmt(det.calls7d)}<!----> calls over 7 days <RouterLink to="/usage" class="facts-link">Usage details</RouterLink></span
                ></FactRow
              ></Facts
            ></section
          >{#if det.mcp}<section aria-labelledby="agent-ready-title" class="service-card agent-card"
              ><div class="agent-card-head"
                ><div class="agent-card-title"
                  ><h2 id="agent-ready-title">Agent-ready</h2><ApiBadge label="mcp" value={pluralize(det.mcp.tools.length, 'tool')} status="info" /></div
                ><CopyButton value={det.mcp.clientConfig} label="Copy MCP config" size="md" variant="primary" /></div
              ><p class="agent-card-lead"
                >Every mock operation is published as an MCP tool. An AI agent discovers it via <span class="demo-mono">tools/list</span> and calls it with arguments derived from the contract's schemas: path, query and body grouped under <span class="demo-mono">params.arguments</span>.</p
              ><div class="agent-card-block"
                ><SectionLabel as="h3">Endpoints</SectionLabel
                >{#each [{ name: 'HTTP SSE', spec: 'MCP 2024-11-05', url: det.mcp.sseUrl }, { name: 'Streamable HTTP', spec: 'MCP 2025-03-26', url: det.mcp.httpUrl }] as endpoint (endpoint.name)}<div
                    class="endpoint-row"
                    ><span class="endpoint-row-name"><span>{endpoint.name}</span><span class="endpoint-row-spec">{endpoint.spec}</span></span
                    ><span class="endpoint-row-url" title={endpoint.url}>{endpoint.url}</span><CopyButton
                      value={endpoint.url}
                      label="Copy"
                      variant="link"
                      aria-label={`Copy ${endpoint.name} URL`}
                      class="endpoint-row-copy"
                    /></div
                  >{/each}</div
              ><div class="agent-card-block"
                ><SectionLabel as="h3">Exposed tools, as an agent sees them</SectionLabel
                >{#each det.mcp.tools as t (t.name)}<div class="tool-card"
                    ><div class="tool-card-main"
                      ><span class="tool-card-name">{t.name}</span><span class="tool-card-desc">{t.description}</span><span class="tool-card-op"
                        ><MethodTag method={t.method} protocol={svc.protocol} class="tool-card-method" /><span class="demo-mono">{t.path}</span></span
                      ></div
                    >{@render scrollPre(`Input schema of ${t.name}`, 'tool-card-schema', t.inputSchema)}</div
                  >{/each}</div
              ><div class="agent-card-block"
                ><SectionLabel as="h3">MCP client config</SectionLabel
                >{@render scrollPre('MCP client config', 'agent-card-config', det.mcp.clientConfig)}<span class="agent-card-foot"
                  >Tested with MCP Inspector, Claude, Postman and Cherry Studio.</span
                ></div
              ></section
            >{:else}<Callout tone="info" title="Not exposed to agents">This service is not published as MCP tools.</Callout>{/if}</div
        ></TabPanel
      ><TabPanel id="tests" idPrefix="svc" value={tabId}
        ><section aria-labelledby="runs-title" class="service-card runs-card"
          ><div class="runs-card-head"
            ><div class="runs-card-title"
              ><h2 id="runs-title">Latest test runs</h2>{#if latestRun}<span
                  ><span class="demo-mono">{latestRun.runner}</span> against <span class="demo-mono">{latestRun.endpoint}</span></span
                >{/if}</div
            ><div class="runs-card-actions"
              ><ButtonRouterLink variant="secondary" class="runs-card-all" to={`/tests/service/${svc.id}`}>All runs</ButtonRouterLink
              ><ButtonRouterLink variant="primary" icon="plus" class="runs-card-new" to={`/tests/create?service=${svc.id}`}>New test</ButtonRouterLink
              ></div
            ></div
          >{#if runs.data && runs.data.length === 0}<p>No test run yet. Run a first test to get a conformance score.</p>{/if}{#if recentRuns.length}<ul
              class="run-list"
              >{#each recentRuns as r (r.id)}{@const tone = runTone(r.result)}<li
                  ><RouterLink to={`/tests/runner/${r.id}`} class="run-list-row"
                    ><span class="run-list-id">#<!---->{r.id}</span><span class="run-list-status" data-tone={tone}
                      ><Icon name={tone === 'passed' ? 'check-circle' : tone === 'running' ? 'running' : 'x-circle'} size={14} stroke-width={2.2} />{tone === 'passed' ? 'Passed' : tone === 'running' ? 'Running' : 'Failed'}</span
                    ><span class="run-list-score">{r.passed}<!---->/<!---->{r.total}</span><Chip size="sm" class="run-list-env">{r.environment}</Chip
                    ><span class="run-list-when">{relative(r.startedAt)}</span><Icon name="chevron" size={14} class="run-list-chevron" /></RouterLink
                  ></li
                >{/each}</ul
            >{/if}</section
        ></TabPanel
      ></Tabs
    ></div
  >
{/if}
