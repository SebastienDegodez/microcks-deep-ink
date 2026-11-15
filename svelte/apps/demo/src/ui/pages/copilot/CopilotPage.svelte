<script lang="ts">
  import '@microcks/demo-styles/pages/copilot/copilot.css';
  import type { Example } from '@microcks/demo-core/domain/shared';
  import {
    ApiBadge,
    Button,
    CopyButton,
    Icon,
    LiveIndicator,
    Textarea,
    MethodTag,
    OpPickList,
    SectionLabel,
    SplitPane,
    SplitPaneMain,
    SplitPaneSide,
    type OpPickOption,
  } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useAnnounce, usePageTitle, useParams, useQuery, useSearchParams, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import ProposalRow from './ProposalRow.svelte';
  import { fresh, type Item } from './proposal';
  import {
    aiBadgeText,
    contractCounts,
    COUNTS,
    exportFileName,
    exportGroups,
    exWord,
    GENERATION_MS,
    mockTarget,
    opPickAi,
    opsWithProposals,
    pendingNoteText,
    proposalSums,
    type OpState,
  } from './generation';

  /** The AI Copilot screen (07): generate examples for one operation, then review each proposal before it joins the Service. */
  const params = useParams();
  // A stable proxy that follows the URL: safe to destructure.
  const [search] = useSearchParams();
  const uc = useUseCases();
  const announce = useAnnounce();
  const serviceId = $derived(params.serviceId ?? '');

  const service = useQuery(() => uc.catalog.getService(serviceId), () => [uc, serviceId]);
  const ops = useQuery(() => uc.catalog.listOperations(serviceId), () => [uc, serviceId]);
  const details = useQuery(() => uc.catalog.getServiceDetails(serviceId), () => [uc, serviceId]);
  const ctx = useQuery(() => uc.copilot.findWorkflowContext(serviceId, search.get('hint') ?? undefined), () => [uc, serviceId, search.get('hint')]);
  const contract = useQuery(
    () => (ops.data ? contractCounts((s, o) => uc.catalog.listExamples(s, o), serviceId, ops.data) : Promise.resolve({} as Record<string, number>)),
    () => [uc, serviceId, ops.data],
  );
  usePageTitle('AI Copilot examples · Microcks');

  // Read once from the URL, as initial values.
  const hintParam = search.get('hint');
  let opId = $state<string | undefined>(search.get('op') ?? undefined);
  let count = $state(3);
  let hint = $state(hintParam ? `French pastry names, e.g. ${hintParam}` : '');
  let byOp = $state.raw<Record<string, OpState>>({});
  let seeded = $state(false);
  let generating = $state<string | undefined>();
  let wfDismissed = $state(false);
  let exportOpen = $state(false);
  let run = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));

  const svc = $derived(service.data);
  const operations = $derived(ops.data);
  const currentOpId = $derived(opId ?? operations?.find((o) => o.id === 'get-name')?.id ?? operations?.[0]?.id ?? '');
  const existing = useQuery(() => (currentOpId ? uc.catalog.listExamples(serviceId, currentOpId) : Promise.resolve([] as Example[])), () => [uc, serviceId, currentOpId]);

  // The screen opens on the review of the last generation: 3 proposals, the first one open.
  $effect(() => {
    // Only synchronous reads are tracked: every dependency is read before the call.
    if (seeded || !currentOpId) return;
    const key = currentOpId;
    const request = { serviceId, operationId: key, count: 3 };
    let live = true;
    void uc.copilot
      .generate(request)
      .then((proposals) => {
        if (!live) return;
        if (!byOp[key]) byOp = { ...byOp, [key]: { phase: 'review', items: proposals.map((p, i) => fresh(p, i === 0)) } };
        seeded = true;
      })
      .catch(() => {
        if (live) seeded = true;
      });
    return () => {
      live = false;
    };
  });

  const op = $derived(operations?.find((o) => o.id === currentOpId) ?? operations?.[0]);
  const opState = $derived<OpState>((op && byOp[op.id]) ?? { phase: 'idle', items: [] });
  const served = $derived((existing.data ?? []).filter((e) => e.reviewState !== 'pending'));
  const contractOf = (id: string) => contract.data?.[id] ?? (id === op?.id ? served.filter((e) => !e.aiGenerated).length : 0);
  const target = $derived(mockTarget(details.data?.mockBase));
  const artifact = $derived(details.data?.artifacts.find((a) => a.role === 'primary')?.file);

  // Like functional updates: each change starts from the current proposals.
  const setItems = (key: string, fn: (items: Item[]) => Item[]) => {
    const st: OpState = byOp[key] ?? { phase: 'review', items: [] };
    byOp = { ...byOp, [key]: { ...st, items: fn(st.items) } };
  };
  const patchItem = (key: string, id: string, fn: (i: Item) => Item) => setItems(key, (items) => items.map((i) => (i.example.id === id ? fn(i) : i)));

  const sum = $derived(proposalSums(byOp));
  const opsWith = $derived(opsWithProposals(byOp));

  // The handlers take the operation id: it stays the one of the pressed control while a call is pending.
  const generate = (key: string) => {
    const ticket = ++run;
    const kept = (byOp[key]?.items ?? []).filter((i) => i.status === 'accepted');
    // As in the prototype: the accepted rows stay, pending and rejected ones go at once (Cancel does not bring them back).
    byOp = { ...byOp, [key]: { phase: 'review', items: kept } };
    generating = key;
    exportOpen = false;
    announce(`Generating ${exWord(count)}…`);
    const started = Date.now();
    void uc.copilot
      .generate({ serviceId, operationId: key, count, hint: hint.trim() || undefined, exclude: kept.map((i) => i.example.name) })
      .then((proposals) => {
        timer = setTimeout(
          () => {
            if (ticket !== run) return;
            byOp = { ...byOp, [key]: { phase: 'review', items: [...kept, ...proposals.map((p, i) => fresh(p, i === 0))] } };
            generating = undefined;
            announce(`${proposals.length} proposals ready to review.`);
          },
          Math.max(0, GENERATION_MS - (Date.now() - started)),
        );
      })
      .catch(() => {
        if (ticket === run) generating = undefined;
      });
  };
  const cancel = () => {
    run++;
    clearTimeout(timer);
    generating = undefined;
    announce('Generation cancelled.');
  };
  const accept = async (key: string, item: Item, edited = false) => {
    let body = item.draftBody;
    try {
      body = JSON.stringify(JSON.parse(item.draftBody), null, 2);
    } catch {
      // Validated before.
    }
    const example: Example = edited ? { ...item.example, name: item.draftName.trim(), response: { ...item.example.response, body } } : item.example;
    const stored = await uc.copilot.accept(serviceId, key, example);
    patchItem(key, item.example.id, (i) => ({ ...i, example: stored, status: 'accepted', edited: edited || i.edited, editing: false, draftName: stored.name, draftBody: stored.response.body }));
    existing.reload();
    announce(`Accepted ${stored.name}.`);
  };
  const reject = async (key: string, item: Item) => {
    await uc.copilot.reject(serviceId, key, item.example.id);
    patchItem(key, item.example.id, (i) => ({ ...i, status: 'rejected', editing: false, expanded: false }));
    announce(`Rejected ${item.example.name}.`);
  };
  const undo = async (key: string, item: Item) => {
    if (item.status === 'accepted') {
      await uc.catalog.removeExample(serviceId, key, item.example.id);
      existing.reload();
    }
    patchItem(key, item.example.id, (i) => ({ ...i, status: 'pending' }));
    announce(`${item.example.name} is pending again.`);
  };
  const acceptAll = async (key: string) => {
    for (const i of (byOp[key]?.items ?? []).filter((x) => x.status === 'pending' && !x.editing)) await accept(key, i);
  };
  const anyCollapsed = $derived(opState.items.some((i) => !i.expanded && i.status !== 'rejected'));

  const groups = $derived(exportGroups(operations ?? [], byOp));
  const exported = $derived(svc ? uc.copilot.exportApiExamples({ name: svc.name, version: svc.version }, groups, 'yaml').text : '');
  const exportFile = $derived(svc ? exportFileName(svc) : '');
  const isGenerating = $derived(op !== undefined && generating === op.id);
  const wf = $derived(ctx.data && !wfDismissed ? ctx.data : undefined);
  const aiBadge = $derived(aiBadgeText(sum));
  const pendingNote = $derived(pendingNoteText(sum));

  const moveCount = (ev: KeyboardEvent & { currentTarget: HTMLButtonElement }, n: number) => {
    const d = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    ev.preventDefault();
    count = COUNTS[(COUNTS.indexOf(n) + d + COUNTS.length) % COUNTS.length] ?? n;
    const group = ev.currentTarget.parentElement;
    requestAnimationFrame(() => group?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  };
</script>

{#snippet aiEnd(o: OpPickOption)}<Icon name="spark" size={11} />{opPickAi(byOp[o.id]?.items, generating === o.id).label}{/snippet}

{#if service.status === 'error' && !service.data}<PageHeader title="AI Copilot" /><ErrorBlock
    error={service.error}
    what="The service"
    onretry={service.reload}
  />{:else if !svc || !operations || !existing.data || !seeded}<PageHeader title="AI Copilot" /><LoadingBlock
    label="the AI Copilot"
  />{:else if !op}<PageHeader title="AI Copilot" /><ErrorBlock error={new Error('This service has no operation.')} what="The operation" />{:else}
  {#snippet notice()}{#if wf}<div role="note" aria-label="Opened from a workflow run" class="copilot-workflow"
        ><ApiBadge arazzo size="sm" /><span class="copilot-workflow-text"
          >Opened from workflow <strong>{wf.workflowSummary}</strong> · the mocks lack an example for <code class="copilot-strong-code">{wf.criteria}</code> (<code
            >{wf.arazzoOperationId}</code
          >)</span
        ><RouterLink to={`/workflows/runs/${wf.runId}`} class="copilot-back"><Icon name="arrow-left" size={13} />Back to the run</RouterLink><Button
          size="sm"
          variant="ghost"
          iconOnly
          icon="close"
          aria-label="Dismiss the workflow context"
          class="copilot-dismiss"
          onclick={() => (wfDismissed = true)}
        /></div
      >{/if}{/snippet}
  {#snippet leading()}<Icon name="spark" size={26} class="copilot-title-icon" />{/snippet}
  {#snippet badge()}<span class="copilot-badges"
      ><RouterLink to={`/services/${svc.id}`} class="copilot-badge-link"><ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} /></RouterLink
      ><ApiBadge
        label="samples"
        value={String(svc.exampleCount ?? served.length)}
        status="action"
        values={aiBadge ? [{ value: aiBadge, status: 'warning' }] : undefined}
      /></span
    >{/snippet}
  {#snippet rows()}<div class="copilot-rows"
      >{#each opState.items as item (item.example.id)}<ProposalRow
          {item}
          {op}
          {target}
          {served}
          onpatch={(fn) => patchItem(op.id, item.example.id, fn)}
          onaccept={(edited) => void accept(op.id, item, edited)}
          onreject={() => void reject(op.id, item)}
          onundo={() => void undo(op.id, item)}
        />{/each}</div
    >{/snippet}
  <div class="copilot"
    ><PageHeader
      title="AI Copilot"
      size="sm"
      notice={wf ? notice : undefined}
      breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${svc.name} ${svc.version}`, to: `/services/${svc.id}` }, { label: 'AI Copilot' }]}
      {leading}
      {badge}
      description="Generate request and response examples from the contract's schemas when the specification has too few. You review every proposal before it joins the Service."
      descriptionTone="secondary"
      descriptionWidth={780}
    /><div role="note" class="copilot-rule"
      ><Icon name="spark" size={15} class="copilot-rule-icon" /><span
        ><strong>AI examples are never served by the mock, counted in conformance tests or exported until a person accepts them.</strong> Accepted examples keep an AI provenance tag on the Service.</span
      ></div
    ><SplitPane sideWidth="300px" sideMax="380px" mainWidth="560px" keepSideMax
      ><SplitPaneSide class="copilot-settings"
        ><section aria-labelledby="sec-op" class="copilot-op"
          ><h2 id="sec-op" class="copilot-section-label">1 · Operation</h2
          ><OpPickList
            mode="radio"
            labelledBy="sec-op"
            value={op.id}
            onchange={(id) => (opId = id)}
            options={operations.map((o) => {
              const ai = opPickAi(byOp[o.id]?.items, generating === o.id);
              return {
                id: o.id,
                method: o.method,
                protocol: svc.protocol,
                path: o.path,
                summary: `${exWord(contractOf(o.id))} in the contract`,
                end: ai.label ? aiEnd : undefined,
                endTone: ai.tone,
              };
            })}
          /></section
        ><section aria-labelledby="sec-settings" class="copilot-box"
          ><h2 id="sec-settings" class="copilot-section-label">2 · Generation settings</h2
          ><div class="copilot-field"
            ><span id="count-label" class="copilot-label">Number of examples</span
            ><div role="radiogroup" aria-labelledby="count-label" class="copilot-count"
              >{#each COUNTS as n (n)}<button
                  type="button"
                  role="radio"
                  aria-checked={count === n}
                  tabindex={count === n ? 0 : -1}
                  onclick={() => (count = n)}
                  onkeydown={(ev) => moveCount(ev, n)}>{n}</button
                >{/each}</div
            ></div
          ><div class="copilot-field"
            ><label for="copilot-hint" class="copilot-label">Hint <span class="copilot-optional">· optional</span></label
            ><Textarea
              id="copilot-hint"
              rows={3}
              value={hint}
              aria-describedby="copilot-hint-help"
              placeholder="Describe the data you want, e.g. edge cases, a locale, a season"
              oninput={(ev) => (hint = ev.currentTarget.value)}
            /><span id="copilot-hint-help" class="copilot-help">Added to the prompt next to the operation and its schemas.</span></div
          ><div class="copilot-model"
            ><SectionLabel lineHeight="normal">Model</SectionLabel><span class="copilot-model-name">OpenAI-compatible endpoint configured by admin</span><span
              class="copilot-model-key">ai-copilot.implementation=openai</span
            ><RouterLink to="/admin">See Administration settings</RouterLink></div
          ><div class="copilot-context"
            ><span class="copilot-context-title">Prompt context</span><span
              >{op.method}<!---->{' '}<!---->{op.path}{#if artifact}{` from ${artifact}`}{/if}, its <!---->{op.schemaSummary
                ? `Pastry schema (${op.schemaSummary})`
                : 'schemas'}<!----> and the <!---->{exWord(contractOf(op.id))}<!----> already defined, so proposals do not repeat them.</span
            ></div
          ><!-- One button that turns into Cancel and back: the same element keeps the focus. --><Button
            variant={isGenerating ? undefined : 'primary'}
            icon={isGenerating ? undefined : 'spark'}
            class="copilot-wide"
            onclick={isGenerating ? cancel : () => generate(op.id)}
            >{isGenerating ? 'Cancel generation' : opState.items.length ? 'Generate again' : `Generate ${exWord(count)}`}</Button
          >{#if !isGenerating && opState.items.length > 0}<span class="copilot-help"
              >Generating again replaces pending and rejected proposals. Accepted ones are kept.</span
            >{/if}</section
        ></SplitPaneSide
      ><SplitPaneMain as="section" aria-labelledby="sec-proposals" class="copilot-proposals"
        ><div class="copilot-proposals-head"
          ><div class="copilot-proposals-title"
            ><h2 id="sec-proposals">Proposals</h2
            ><span class="copilot-op-key"><MethodTag method={op.method} protocol={svc.protocol} /><span class="copilot-op-path">{op.path}</span></span
            ></div
          >{#if opState.items.length > 0}<div class="copilot-bulk"
              ><Button size="sm" variant="link" onclick={() => void acceptAll(op.id)}>Accept all pending</Button><Button
                size="sm"
                variant="link"
                onclick={() => setItems(op.id, (items) => items.map((i) => ({ ...i, expanded: anyCollapsed })))}
                >{anyCollapsed ? 'Expand all' : 'Collapse all'}</Button
              ></div
            >{/if}</div
        >{#if isGenerating}<div role="status" class="copilot-generating"
            ><p class="copilot-generating-line"
              ><LiveIndicator size="compact" pulse={false} />Generating <!---->{exWord(count)}<!----> for <!---->{op.method}<!---->{' '}<!---->{op.path}{#if hint.trim()}{` · hint: "${hint.trim()}"`}{/if}…</p
            >{#each Array.from({ length: count }, (_, i) => i) as i (i)}<div aria-hidden="true" class="copilot-skeleton" style="opacity: {1 - i * 0.15}"
                ><Icon name="spark" size={14} class="copilot-skeleton-icon" /><span class="copilot-skeleton-bars"
                  ><span style="width: {`${46 + ((i * 17) % 30)}%`}"></span><span style="width: {`${28 + ((i * 23) % 26)}%`}"></span></span
                ></div
              >{/each}</div
          >{#if opState.items.length > 0}{@render rows()}{/if}{:else if opState.items.length === 0}<div class="copilot-empty"
            ><Icon name="spark" size={22} class="copilot-empty-icon" /><h3>No proposal for this operation yet</h3
            ><p>Choose how many examples you want, add a hint if useful, then generate. Proposals appear here as ghost rows for review.</p></div
          >{:else}{@render rows()}{/if}<div class="copilot-summary"
          ><p class="copilot-counts" role="status"
            ><span data-tone="success"><Icon name="check" size={14} /><span><strong>{sum.accepted}</strong> accepted</span></span><span
              aria-hidden="true"
              class="copilot-dot">·</span
            ><span data-tone="muted"><Icon name="cross" size={14} /><span><strong>{sum.rejected}</strong> rejected</span></span><span
              aria-hidden="true"
              class="copilot-dot">·</span
            ><span data-tone="warning"><Icon name="spark" size={14} /><span><strong>{sum.pending}</strong> pending</span></span
            >{#if opsWith.length > 1}<span class="copilot-across">across <!---->{opsWith.length}<!----> operations</span>{/if}</p
          ><span class="copilot-summary-actions"
            ><Button
              icon="download"
              class="copilot-export"
              disabled={sum.accepted === 0}
              aria-expanded={exportOpen && sum.accepted > 0}
              aria-controls="copilot-export"
              onclick={() => (exportOpen = !exportOpen)}>Export accepted examples (APIExamples)</Button
            >{#if sum.accepted > 0}<ButtonRouterLink variant="primary" icon="plus" class="copilot-add" to={`/services/${svc.id}?op=${op.id}`}
                >Add <!---->{exWord(sum.accepted)}<!----> to <!---->{svc.name}<!---->{' '}<!---->{svc.version}</ButtonRouterLink
              >{:else}<span aria-disabled="true" class="copilot-add-disabled">Accept a proposal to add it</span>{/if}</span
          ></div
        >{#if pendingNote}<span class="copilot-help">{pendingNote}</span>{/if}{#if exportOpen && sum.accepted > 0}<div
            id="copilot-export"
            class="copilot-export-preview"
            ><div class="copilot-export-head"
              ><span class="copilot-export-name"
                ><span class="copilot-export-file">{exportFile}</span><span class="copilot-help"
                  >Secondary artifact. Re-import it on another Microcks to share these examples.</span
                ></span
              ><CopyButton value={exported} label="Copy" variant="link" size="sm" /></div
            ><!-- The YAML scrolls, so it is a named, focusable region (WCAG 2.1.1). --><!-- svelte-ignore a11y_no_noninteractive_tabindex --><pre
              role="region"
              tabindex="0"
              aria-label={`${exportFile} content`}>{exported}</pre
            ></div
          >{/if}</SplitPaneMain
      ></SplitPane
    ></div
  >
{/if}
