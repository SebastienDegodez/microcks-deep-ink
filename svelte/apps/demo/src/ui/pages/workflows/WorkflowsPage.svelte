<script lang="ts">
  import { untrack } from 'svelte';
  import type { ArazzoDocument, RunKindFilter, SourceDescription } from '@microcks/demo-core/domain/arazzo';
  import type { WorkflowListItem } from '@microcks/demo-core/application/arazzo';
  import { ApiBadge, Button, Callout, Chip, EmptyState, FilterBar, FilterReset, FilterRow, FilterSearch, Icon, Segmented } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, useAnnounce, usePageTitle, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
  import { ErrorBlock } from '@/ui/app/states';
  import DocumentGroup from './DocumentGroup.svelte';
  import LinkSourceDialog from './LinkSourceDialog.svelte';
  import { ONBOARDING, RESULTS, RESULT_LABEL, SAMPLE_YAML, SKELETONS, TARGETS, TARGET_LABEL, usesSource, type Result } from './listing';
  import '@microcks/demo-styles/pages/workflows/workflows.css';

  interface LinkTarget { document: ArazzoDocument; source: SourceDescription }

  usePageTitle('Workflows · Microcks');
  const uc = useUseCases();
  const announce = useAnnounce();
  const relative = useRelativeTime();
  let q = $state('');
  let result = $state<Result>('all');
  let runKind = $state<RunKindFilter>('any');
  let sources = $state.raw<string[]>([]);
  let demo = $state<'loading' | 'empty' | null>(null);
  let linking = $state.raw<LinkTarget | null>(null);
  let linked = $state<string | null>(null);

  const docs = useQuery(() => uc.arazzo.listDocuments(), () => [linked]);
  const services = useQuery(() => uc.catalog.listServices());
  const everything = useQuery(() => uc.arazzo.listWorkflows({}), () => [linked]);
  const sourcesKey = $derived(sources.join(','));
  const list = useQuery(async () => {
    const base = { query: q, sources, runKind };
    // Counts leave their own filter out.
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
  }, () => [q, sourcesKey, runKind, result, linked]);

  const items: WorkflowListItem[] = $derived(list.data?.[result] ?? []);
  const loadError = $derived(docs.error ?? list.error);
  const counts = $derived(list.data ? { all: list.data.all.length, passed: list.data.passed.length, failed: list.data.failed.length, never: list.data.never.length } : undefined);
  // Linking mutates the adapter's documents in place; refresh the derived list on each response.
  const documents = $derived((docs.data ?? []).map((document) => ({
    ...document,
    sources: document.sources.map((source) => ({ ...source })),
  })));
  const allSources = $derived(documents.flatMap((d) => d.sources));
  const unlinkedTotal = $derived(allSources.filter((s) => s.link.status === 'not-linked').length);
  const totalWorkflows = $derived(documents.reduce((n, d) => n + d.workflowIds.length, 0));
  const allWorkflows = $derived(everything.data ?? []);
  const activeDesc = $derived([
    ...(q.trim() ? [`“${q.trim()}”`] : []),
    ...(result !== 'all' ? [RESULT_LABEL[result]] : []),
    ...(runKind !== 'any' ? [TARGET_LABEL[runKind]] : []),
    ...sources,
  ]);
  const activeCount = $derived(activeDesc.length);

  // Announce a result count only after the first successful load.
  let first = true;
  $effect(() => {
    const status = list.status;
    const count = items.length;
    void result;
    untrack(() => {
      if (first) {
        if (status === 'success') first = false;
        return;
      }
      if (status === 'success') announce(`${count} of ${totalWorkflows} workflows`);
    });
  });

  const reset = () => { q = ''; result = 'all'; runKind = 'any'; sources = []; };
  const serviceOf = (id: string) => services.data?.find((s) => s.id === id);
  const serviceName = (id: string) => {
    const service = serviceOf(id);
    return service ? { name: service.name, version: service.version } : undefined;
  };
  const showOnboarding = $derived(demo === 'empty' || (docs.status === 'success' && documents.length === 0));
  const loading = $derived(demo === 'loading' || ((docs.status === 'loading' || list.status === 'loading') && !list.data));
  const targetPhrase = $derived(runKind === 'any' ? 'any target' : TARGET_LABEL[runKind]);
  const groups = $derived(documents
    .map((document) => ({ document, rows: items.filter((i) => i.document.id === document.id) }))
    .filter((g) => g.rows.length > 0));
  const countLine = $derived(showOnboarding ? '0 workflows · 0 Arazzo documents' : loading ? 'Loading…'
    : `${totalWorkflows} workflows · ${documents.length} Arazzo documents · ${allSources.length} source descriptions (${unlinkedTotal} not linked)`);
  const ready = $derived(!loading && !showOnboarding && docs.status === 'success');
</script>

{#snippet actions()}<ButtonRouterLink to="/sources" variant="secondary" icon="git-branch">Sources</ButtonRouterLink><ButtonRouterLink to="/sources/new" variant="primary" icon="download">Import Arazzo document</ButtonRouterLink>{/snippet}

{#snippet onboarding()}<section aria-labelledby="wf-onb-title" class="wf-onb"
    ><div class="wf-onb-main"
      ><div class="wf-onb-head"
        ><ApiBadge arazzo name="no workflow yet" class="wf-onb-badge" /><h2 id="wf-onb-title">Bring your API workflows into Microcks</h2><p class="wf-onb-lead"
          >Arazzo is the OpenAPI Initiative specification for describing multi-step API workflows, where the output of one call feeds the next. Import an Arazzo document and link each of its source descriptions to an API already in Microcks: the whole journey can then be played on the mocks and run end to end against your implementations.</p
        ></div
      ><ol class="wf-onb-steps"
        >{#each ONBOARDING as s, i (s.title)}<li
            ><span aria-hidden="true" class="wf-onb-n">{i + 1}</span><span class="wf-onb-text"><span class="wf-onb-title">{s.title}</span><span class="wf-onb-desc">{s.text}</span></span></li
          >{/each}</ol
      ><div class="wf-row"
        ><ButtonRouterLink to="/sources/new" variant="primary" icon="download">Import Arazzo document</ButtonRouterLink><ButtonRouterLink to="/sources" variant="secondary">Sync from a Git repository</ButtonRouterLink></div
      ></div
    ><figure class="wf-onb-figure"><figcaption>A minimal Arazzo document</figcaption><pre>{SAMPLE_YAML}</pre></figure></section
  >{/snippet}

{#snippet loadingGroup()}<section aria-busy="true" aria-label="Loading workflows" class="wf-doc wf-skel"
    ><span class="sr-only" role="status">Loading workflows…</span><div aria-hidden="true" class="wf-skel-head"
      ><div class="wf-skel-line"
        ><span class="wf-skel-bar" data-fill="raised" style="width: 240px; max-width: 60%; height: 14px"></span><span class="wf-skel-bar" style="width: 90px; height: 14px"></span><span class="wf-skel-bar" style="width: 90px; height: 14px"></span></div
      ><div class="wf-skel-line"
        >{#each [170, 200, 150] as width (width)}<span class="wf-skel-bar" data-shape="chip" style:width={`${width}px`} style:height="22px"></span>{/each}</div
      ></div
    >{#each SKELETONS as s, i (i)}<div aria-hidden="true" class="wf-skel-row" style:opacity={s.opacity}
        ><span class="wf-skel-stack"
          ><span class="wf-skel-bar" data-fill="raised" data-shape="chip" style:width={s.w1} style:height="22px"></span><span class="wf-skel-bar" style="width: 40%; height: 10px; border-radius: 3px"></span></span
        ><span class="wf-skel-bar" data-shape="pill" style="width: 88px; height: 10px"></span><span class="wf-skel-bar wf-skel-flex" style:max-width={s.w2} style:height="12px"></span><span class="wf-skel-bar wf-skel-end" style="width: 64px; height: 30px"></span></div
      >{/each}</section
  >{/snippet}

{#snippet emptyActions()}<Button variant="primary" icon="reset" onclick={reset}>Reset filters</Button>{/snippet}

<div class="wf-page" data-main-pad="roomy"
  ><PageHeader
    title="Workflows"
    meta={countLine}
    size="lg"
    description="Multi-step API journeys described with Arazzo. Each step calls an operation of an API already in Microcks; play them against the mocks or against your implementations, or call them through their Mock URL."
    {actions}
  />{#if linked}<Callout tone="success" title={`${linked} linked`} live="polite">The workflows that use it can run now.</Callout>{/if}{#if loadError}<ErrorBlock
      error={loadError}
      onretry={() => docs.status === 'error' ? docs.reload() : list.reload()}
      title="Workflows could not be loaded"
    />{/if}{#if !showOnboarding}<FilterBar label="Workflow filters"
      ><FilterRow
        ><FilterSearch label="Filter workflows" placeholder="Filter by name, workflowId or stepId…" autocomplete="off" value={q} oninput={(e) => q = e.currentTarget.value} /><Segmented
          label="Last run result"
          options={RESULTS.map((r) => ({ ...r, count: counts?.[r.id] }))}
          value={result}
          onchange={(id) => result = id as Result}
        /><Segmented
          label="Run target"
          options={TARGETS.map((t) => ({ ...t, count: list.data?.targetCounts[t.id] }))}
          value={runKind}
          onchange={(id) => runKind = id as RunKindFilter}
        /></FilterRow
      ><FilterRow title="Sources"
        >{#each allSources as source (source.name)}{@const linkedTo = source.link.status === 'linked' ? serviceOf(source.link.serviceId) : undefined}{@const count = (list.data?.bySource ?? []).filter((w) => usesSource(w.workflow, source.name)).length}{@const toggle = () => sources = sources.includes(source.name) ? sources.filter((n) => n !== source.name) : [...sources, source.name]}{#if source.link.status === 'not-linked'}<Chip class="wf-src-unlinked" pressed={sources.includes(source.name)} {count} onclick={toggle}
              ><Icon name="warning" size={13} stroke-width={2.2} />{source.name}<!----> · not linked</Chip
            >{:else}<Chip protocol={source.link.protocol} pressed={sources.includes(source.name)} {count} onclick={toggle}
              >{linkedTo ? `${linkedTo.name} ${linkedTo.version}` : source.name}</Chip
            >{/if}{/each}{#if activeCount > 0}<FilterReset count={activeCount} onclick={reset} />{/if}</FilterRow
      ></FilterBar
    >{/if}{#if loading && !showOnboarding}{@render loadingGroup()}{/if}{#if showOnboarding && !loading}{@render onboarding()}{/if}{#if ready && items.length > 0}<div class="wf-result-line"
      ><p role="status" aria-live="off"><span class="wf-result-count">{items.length}</span> of <!---->{totalWorkflows}<!----> workflows · last run on <!---->{targetPhrase}</p><p class="wf-legend"
        ><span class="wf-legend-lead">Steps: one dot per step, one lane per source</span><span class="wf-legend-item"
          ><span aria-hidden="true" class="wf-loom-dot" data-state="ok" data-legend=""></span>passed</span
        ><span class="wf-legend-item"><span aria-hidden="true" class="wf-loom-dot" data-state="ko" data-legend=""></span>failed</span><span class="wf-legend-item"
          ><span aria-hidden="true" class="wf-loom-dot" data-state="skip" data-legend=""></span>not reached</span
        ><span class="wf-legend-item"><span aria-hidden="true" class="wf-loom-dot" data-state="never" data-legend=""></span>never run</span><span class="wf-legend-item"
          ><span aria-hidden="true" class="wf-legend-bars"><span></span><span></span></span>parallel branches (step dependsOn)</span
        ></p
      ></div
    ><div class="wf-groups"
      >{#each groups as group (group.document.id)}<DocumentGroup
          document={group.document}
          rows={group.rows}
          docWorkflows={allWorkflows.filter((w) => w.document.id === group.document.id)}
          total={group.document.workflowIds.length}
          {serviceName}
          {relative}
          {runKind}
          onlink={(source) => linking = { document: group.document, source }}
        />{/each}</div
    >{/if}{#if ready && list.data && items.length === 0}<EmptyState title="No workflow matches these filters" icon="search-x" actions={emptyActions}
      ><p>None of the <!---->{totalWorkflows}<!----> workflows matches: <!---->{activeDesc.join(' · ')}<!---->. Remove a filter or reset the selection.</p></EmptyState
    >{/if}{#if linking}<LinkSourceDialog
      open
      document={linking.document}
      source={linking.source}
      onclose={() => linking = null}
      onlinked={(service) => {
        if (!linking) return;
        linked = `${linking.source.name} → ${service.name} ${service.version}`;
        linking = null;
      }}
    />{/if}<section aria-label="Prototype states" class="wf-demo"
    ><span>Prototype states</span><button type="button" class="wf-demo-btn" aria-pressed={demo === 'loading'} onclick={() => demo = demo === 'loading' ? null : 'loading'}
      >Show loading</button
    ><button type="button" class="wf-demo-btn" aria-pressed={demo === 'empty'} onclick={() => demo = demo === 'empty' ? null : 'empty'}>Show empty state</button></section
  ></div
>
