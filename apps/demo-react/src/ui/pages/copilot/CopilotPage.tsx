import './copilot.css';
import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import type { ExampleGroup } from '@/domain/copilot';
import type { Example, Operation } from '@/domain/shared';
import { PageHeader, useAnnounce, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Icon } from '@/ui/components/ui/icon';
import { Textarea } from '@/ui/components/ui/input';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { OpPickList } from '@/ui/components/ui/op-pick';
import { SectionLabel } from '@/ui/components/ui/section-label';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { fresh, ProposalRow, type Item, type MockTarget } from './ProposalRow';

interface OpState { phase: 'idle' | 'review'; items: Item[] }

const COUNTS = [1, 2, 3, 4, 5];
/** The Copilot takes a while: the skeleton rows stay this long, as in the prototype. */
const GENERATION_MS = 1800;
const DEFAULT_TARGET: MockTarget = { host: 'microcks.local:8080', basePath: '' };

const exWord = (n: number) => `${n} ${n === 1 ? 'example' : 'examples'}`;

function mockTarget(mockBase: string | undefined): MockTarget {
  if (!mockBase) return DEFAULT_TARGET;
  try {
    const url = new URL(mockBase);
    return { host: url.host, basePath: url.pathname.replace(/\/$/, '') };
  } catch {
    return DEFAULT_TARGET;
  }
}

/** Contract examples by operation id (AI examples, pending or accepted, are not part of the contract). */
async function contractCounts(listExamples: (s: string, o: string) => Promise<Example[]>, serviceId: string, ops: Operation[]) {
  const lists = await Promise.all(ops.map((o) => listExamples(serviceId, o.id)));
  return Object.fromEntries(ops.map((o, i) => [o.id, (lists[i] ?? []).filter((e) => !e.aiGenerated).length])) as Record<string, number>;
}

export default function CopilotPage() {
  const { serviceId = '' } = useParams();
  const [search] = useSearchParams();
  const uc = useUseCases();
  const announce = useAnnounce();
  const service = useQuery(() => uc.catalog.getService(serviceId), [uc, serviceId]);
  const ops = useQuery(() => uc.catalog.listOperations(serviceId), [uc, serviceId]);
  const details = useQuery(() => uc.catalog.getServiceDetails(serviceId), [uc, serviceId]);
  const ctx = useQuery(() => uc.copilot.findWorkflowContext(serviceId, search.get('hint') ?? undefined), [uc, serviceId, search]);
  const contract = useQuery(
    () => (ops.data ? contractCounts((s, o) => uc.catalog.listExamples(s, o), serviceId, ops.data) : Promise.resolve({} as Record<string, number>)),
    [uc, serviceId, ops.data],
  );
  usePageTitle('AI Copilot examples · Microcks');

  const hintParam = search.get('hint');
  const [opId, setOpId] = useState<string | undefined>(search.get('op') ?? undefined);
  const [count, setCount] = useState(3);
  const [hint, setHint] = useState(hintParam ? `French pastry names, e.g. ${hintParam}` : '');
  const [byOp, setByOp] = useState<Record<string, OpState>>({});
  const [seeded, setSeeded] = useState(false);
  const [generating, setGenerating] = useState<string | undefined>();
  const [wfDismissed, setWfDismissed] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const operations = ops.data;
  const currentOpId = opId ?? operations?.find((o) => o.id === 'get-name')?.id ?? operations?.[0]?.id ?? '';
  const existing = useQuery(() => (currentOpId ? uc.catalog.listExamples(serviceId, currentOpId) : Promise.resolve([] as Example[])), [uc, serviceId, currentOpId]);

  // The screen opens on the review of the last generation: 3 proposals, the first one open.
  useEffect(() => {
    if (seeded || !currentOpId) return;
    let live = true;
    void uc.copilot
      .generate({ serviceId, operationId: currentOpId, count: 3 })
      .then((proposals) => {
        if (!live) return;
        setByOp((cur) => (cur[currentOpId] ? cur : { ...cur, [currentOpId]: { phase: 'review', items: proposals.map((p, i) => fresh(p, i === 0)) } }));
        setSeeded(true);
      })
      .catch(() => live && setSeeded(true));
    return () => { live = false; };
  }, [uc, serviceId, currentOpId, seeded]);

  if (service.status === 'error' && !service.data) {
    return (<><PageHeader title="AI Copilot" /><ErrorBlock error={service.error} what="The service" onRetry={service.reload} /></>);
  }
  const svc = service.data;
  if (!svc || !operations || !existing.data || !seeded) {
    return (<><PageHeader title="AI Copilot" /><LoadingBlock label="the AI Copilot" /></>);
  }
  const op: Operation | undefined = operations.find((o) => o.id === currentOpId) ?? operations[0];
  if (!op) return (<><PageHeader title="AI Copilot" /><ErrorBlock error={new Error('This service has no operation.')} what="The operation" /></>);

  const state: OpState = byOp[op.id] ?? { phase: 'idle', items: [] };
  const served = existing.data.filter((e) => e.reviewState !== 'pending');
  const contractOf = (id: string) => contract.data?.[id] ?? (id === op.id ? served.filter((e) => !e.aiGenerated).length : 0);
  const target = mockTarget(details.data?.mockBase);
  const artifact = details.data?.artifacts.find((a) => a.role === 'primary')?.file;

  const setItems = (key: string, fn: (items: Item[]) => Item[]) =>
    setByOp((cur) => {
      const st = cur[key] ?? { phase: 'review', items: [] };
      return { ...cur, [key]: { ...st, items: fn(st.items) } };
    });
  const patchItem = (key: string, id: string, fn: (i: Item) => Item) => setItems(key, (items) => items.map((i) => (i.example.id === id ? fn(i) : i)));

  const all = Object.values(byOp).flatMap((s) => s.items);
  const sum = {
    accepted: all.filter((i) => i.status === 'accepted').length,
    rejected: all.filter((i) => i.status === 'rejected').length,
    pending: all.filter((i) => i.status === 'pending').length,
  };
  const opsWith = Object.keys(byOp).filter((k) => (byOp[k]?.items ?? []).some((i) => i.status !== 'rejected'));

  const generate = () => {
    const key = op.id;
    const ticket = ++run.current;
    const kept = (byOp[key]?.items ?? []).filter((i) => i.status === 'accepted');
    // As in the prototype: the accepted rows stay, pending and rejected ones go at once (Cancel does not bring them back).
    setByOp((cur) => ({ ...cur, [key]: { phase: 'review', items: kept } }));
    setGenerating(key);
    setExportOpen(false);
    announce(`Generating ${exWord(count)}…`);
    const started = Date.now();
    void uc.copilot
      .generate({ serviceId, operationId: key, count, hint: hint.trim() || undefined, exclude: kept.map((i) => i.example.name) })
      .then((proposals) => {
        timer.current = setTimeout(() => {
          if (ticket !== run.current) return;
          setByOp((cur) => ({ ...cur, [key]: { phase: 'review', items: [...kept, ...proposals.map((p, i) => fresh(p, i === 0))] } }));
          setGenerating(undefined);
          announce(`${proposals.length} proposals ready to review.`);
        }, Math.max(0, GENERATION_MS - (Date.now() - started)));
      })
      .catch(() => { if (ticket === run.current) setGenerating(undefined); });
  };
  const cancel = () => {
    run.current++;
    clearTimeout(timer.current);
    setGenerating(undefined);
    announce('Generation cancelled.');
  };
  const accept = async (item: Item, edited = false) => {
    let body = item.draftBody;
    try { body = JSON.stringify(JSON.parse(item.draftBody), null, 2); } catch { /* validated before */ }
    const example: Example = edited ? { ...item.example, name: item.draftName.trim(), response: { ...item.example.response, body } } : item.example;
    const stored = await uc.copilot.accept(serviceId, op.id, example);
    patchItem(op.id, item.example.id, (i) => ({ ...i, example: stored, status: 'accepted', edited: edited || i.edited, editing: false, draftName: stored.name, draftBody: stored.response.body }));
    existing.reload();
    announce(`Accepted ${stored.name}.`);
  };
  const reject = async (item: Item) => {
    await uc.copilot.reject(serviceId, op.id, item.example.id);
    patchItem(op.id, item.example.id, (i) => ({ ...i, status: 'rejected', editing: false, expanded: false }));
    announce(`Rejected ${item.example.name}.`);
  };
  const undo = async (item: Item) => {
    if (item.status === 'accepted') {
      await uc.catalog.removeExample(serviceId, op.id, item.example.id);
      existing.reload();
    }
    patchItem(op.id, item.example.id, (i) => ({ ...i, status: 'pending' }));
    announce(`${item.example.name} is pending again.`);
  };
  const acceptAll = async () => {
    for (const i of state.items.filter((x) => x.status === 'pending' && !x.editing)) await accept(i);
  };
  const anyCollapsed = state.items.some((i) => !i.expanded && i.status !== 'rejected');

  const groups: ExampleGroup[] = operations
    .map((o) => ({ operationKey: `${o.method} ${o.path}`, examples: (byOp[o.id]?.items ?? []).filter((i) => i.status === 'accepted').map((i) => i.example) }))
    .filter((g) => g.examples.length > 0);
  const exported = uc.copilot.exportApiExamples({ name: svc.name, version: svc.version }, groups, 'yaml');
  const exportFile = `${svc.name.toLowerCase().replace(/\s+/g, '-')}-${svc.version}-examples.yaml`;
  const isGenerating = generating === op.id;
  const rows = (
            <div className="copilot-rows">
              {state.items.map((item) => (
                <ProposalRow
                  key={item.example.id}
                  item={item}
                  op={op}
                  target={target}
                  served={served}
                  onPatch={(fn) => patchItem(op.id, item.example.id, fn)}
                  onAccept={(edited) => void accept(item, edited)}
                  onReject={() => void reject(item)}
                  onUndo={() => void undo(item)}
                />
              ))}
            </div>
  );
  const wf = ctx.data && !wfDismissed ? ctx.data : undefined;
  const aiBadge = sum.accepted ? `+${sum.accepted} AI` : sum.pending ? `+${sum.pending} AI pending` : undefined;
  const pendingNote = sum.accepted > 0 && sum.pending > 0 ? `${sum.pending} pending ${sum.pending === 1 ? 'proposal stays' : 'proposals stay'} here and are not added.` : undefined;

  return (
    <div className="copilot">
      <PageHeader
        title="AI Copilot"
        size="sm"
        notice={
          wf ? (
            <div role="note" aria-label="Opened from a workflow run" className="copilot-workflow">
              <ApiBadge arazzo size="sm" />
              <span className="copilot-workflow-text">
                Opened from workflow <strong>{wf.workflowSummary}</strong> · the mocks lack an example for <code className="copilot-strong-code">{wf.criteria}</code> (<code>{wf.arazzoOperationId}</code>)
              </span>
              <RouterLink to={`/workflows/runs/${wf.runId}`} className="copilot-back"><Icon name="arrow-left" size={13} />Back to the run</RouterLink>
              <Button size="sm" variant="ghost" iconOnly icon="close" aria-label="Dismiss the workflow context" className="copilot-dismiss" onClick={() => setWfDismissed(true)} />
            </div>
          ) : undefined
        }
        breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${svc.name} ${svc.version}`, to: `/services/${svc.id}` }, { label: 'AI Copilot' }]}
        leading={<Icon name="spark" size={26} className="copilot-title-icon" />}
        badge={
          <span className="copilot-badges">
            <RouterLink to={`/services/${svc.id}`} className="copilot-badge-link"><ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} /></RouterLink>
            <ApiBadge label="samples" value={String(svc.exampleCount ?? served.length)} status="action" values={aiBadge ? [{ value: aiBadge, status: 'warning' }] : undefined} />
          </span>
        }
        description="Generate request and response examples from the contract's schemas when the specification has too few. You review every proposal before it joins the Service."
        descriptionTone="secondary"
        descriptionWidth={780}
      />
      <div role="note" className="copilot-rule">
        <Icon name="spark" size={15} />
        <span><strong>AI examples are never served by the mock, counted in conformance tests or exported until a person accepts them.</strong> Accepted examples keep an AI provenance tag on the Service.</span>
      </div>

      <div className="copilot-layout">
        <div className="copilot-settings">
          <section aria-labelledby="sec-op" className="copilot-op">
            <h2 id="sec-op" className="copilot-section-label">1 · Operation</h2>
            <OpPickList
              mode="radio"
              labelledBy="sec-op"
              value={op.id}
              onChange={setOpId}
              options={operations.map((o) => {
                const its = byOp[o.id]?.items ?? [];
                const pe = its.filter((i) => i.status === 'pending').length;
                const ac = its.filter((i) => i.status === 'accepted').length;
                const ai = generating === o.id ? 'generating' : pe ? `+${pe} pending` : ac ? `+${ac} accepted` : '';
                return {
                  id: o.id,
                  method: o.method,
                  protocol: svc.protocol,
                  path: o.path,
                  summary: `${exWord(contractOf(o.id))} in the contract`,
                  end: ai ? <><Icon name="spark" size={11} />{ai}</> : undefined,
                  endTone: ac && !pe && generating !== o.id ? 'success' : 'warning',
                };
              })}
            />
          </section>

          <section aria-labelledby="sec-settings" className="copilot-box">
            <h2 id="sec-settings" className="copilot-section-label">2 · Generation settings</h2>
            <div className="copilot-field">
              <span id="count-label" className="copilot-label">Number of examples</span>
              <div role="radiogroup" aria-labelledby="count-label" className="copilot-count">
                {COUNTS.map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={count === n} tabIndex={count === n ? 0 : -1} onClick={() => setCount(n)}
                    onKeyDown={(ev) => {
                      const d = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? -1 : 0;
                      if (!d) return;
                      ev.preventDefault();
                      const next = COUNTS[(COUNTS.indexOf(n) + d + COUNTS.length) % COUNTS.length] ?? n;
                      setCount(next);
                      const group = ev.currentTarget.parentElement;
                      requestAnimationFrame(() => (group?.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus());
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>
            <div className="copilot-field">
              <label htmlFor="copilot-hint" className="copilot-label">Hint <span className="copilot-optional">· optional</span></label>
              <Textarea id="copilot-hint" rows={3} value={hint} aria-describedby="copilot-hint-help"
                placeholder="Describe the data you want, e.g. edge cases, a locale, a season" onChange={(e) => setHint(e.target.value)} />
              <span id="copilot-hint-help" className="copilot-help">Added to the prompt next to the operation and its schemas.</span>
            </div>
            <div className="copilot-model">
              <SectionLabel lineHeight="normal">Model</SectionLabel>
              <span className="copilot-model-name">OpenAI-compatible endpoint configured by admin</span>
              <span className="copilot-model-key">ai-copilot.implementation=openai</span>
              <RouterLink to="/admin">See Administration settings</RouterLink>
            </div>
            <div className="copilot-context">
              <span className="copilot-context-title">Prompt context</span>
              <span>
                {op.method} {op.path}{artifact ? ` from ${artifact}` : ''}, its {op.schemaSummary ? `Pastry schema (${op.schemaSummary})` : 'schemas'} and the {exWord(contractOf(op.id))} already defined, so proposals do not repeat them.
              </span>
            </div>
            {isGenerating ? (
              <Button className="copilot-wide" onClick={cancel}>Cancel generation</Button>
            ) : (
              <Button variant="primary" icon="spark" className="copilot-wide" onClick={generate}>{state.items.length ? 'Generate again' : `Generate ${exWord(count)}`}</Button>
            )}
            {!isGenerating && state.items.length > 0 ? <span className="copilot-help">Generating again replaces pending and rejected proposals. Accepted ones are kept.</span> : null}
          </section>
        </div>

        <section aria-labelledby="sec-proposals" className="copilot-proposals">
          <div className="copilot-proposals-head">
            <div className="copilot-proposals-title">
              <h2 id="sec-proposals">Proposals</h2>
              <span className="copilot-op-key"><MethodTag method={op.method} protocol={svc.protocol} /><span className="copilot-op-path">{op.path}</span></span>
            </div>
            {state.items.length > 0 ? (
              <div className="copilot-bulk">
                <Button size="sm" variant="link" onClick={() => void acceptAll()}>Accept all pending</Button>
                <Button size="sm" variant="link" onClick={() => setItems(op.id, (items) => items.map((i) => ({ ...i, expanded: anyCollapsed })))}>{anyCollapsed ? 'Expand all' : 'Collapse all'}</Button>
              </div>
            ) : null}
          </div>

          {isGenerating ? (
            <>
            <div role="status" className="copilot-generating">
              <p className="copilot-generating-line">
                <span className="copilot-live"><span aria-hidden="true" className="copilot-live-dot" />live</span>
                Generating {exWord(count)} for {op.method} {op.path}{hint.trim() ? ` · hint: "${hint.trim()}"` : ''}…
              </p>
              {Array.from({ length: count }, (_, i) => (
                <div key={i} aria-hidden="true" className="copilot-skeleton" style={{ opacity: 1 - i * 0.15 }}>
                  <Icon name="spark" size={14} />
                  <span className="copilot-skeleton-bars">
                    <span style={{ width: `${46 + ((i * 17) % 30)}%` }} />
                    <span style={{ width: `${28 + ((i * 23) % 26)}%` }} />
                  </span>
                </div>
              ))}
            </div>
            {state.items.length > 0 ? rows : null}
            </>
          ) : state.items.length === 0 ? (
            <div className="copilot-empty">
              <Icon name="spark" size={22} />
              <h3>No proposal for this operation yet</h3>
              <p>Choose how many examples you want, add a hint if useful, then generate. Proposals appear here as ghost rows for review.</p>
            </div>
          ) : rows}

          <div className="copilot-summary">
            <p className="copilot-counts" role="status">
              <span data-tone="success"><Icon name="check" size={14} /><span><strong>{sum.accepted}</strong> accepted</span></span>
              <span aria-hidden="true" className="copilot-dot">·</span>
              <span data-tone="muted"><Icon name="cross" size={14} /><span><strong>{sum.rejected}</strong> rejected</span></span>
              <span aria-hidden="true" className="copilot-dot">·</span>
              <span data-tone="warning"><Icon name="spark" size={14} /><span><strong>{sum.pending}</strong> pending</span></span>
              {opsWith.length > 1 ? <span className="copilot-across">across {opsWith.length} operations</span> : null}
            </p>
            <span className="copilot-summary-actions">
              <Button icon="download" className="copilot-export" disabled={sum.accepted === 0} aria-expanded={exportOpen && sum.accepted > 0} aria-controls="copilot-export" onClick={() => setExportOpen((v) => !v)}>
                Export accepted examples (APIExamples)
              </Button>
              {sum.accepted > 0 ? (
                <Button asChild variant="primary" icon="plus" className="copilot-add">
                  <RouterLink to={`/services/${svc.id}?op=${op.id}`}>Add {exWord(sum.accepted)} to {svc.name} {svc.version}</RouterLink>
                </Button>
              ) : (
                <span aria-disabled="true" className="copilot-add-disabled">Accept a proposal to add it</span>
              )}
            </span>
          </div>
          {pendingNote ? <span className="copilot-help">{pendingNote}</span> : null}

          {exportOpen && sum.accepted > 0 ? (
            <div id="copilot-export" className="copilot-export-preview">
              <div className="copilot-export-head">
                <span className="copilot-export-name">
                  <span className="copilot-export-file">{exportFile}</span>
                  <span className="copilot-help">Secondary artifact. Re-import it on another Microcks to share these examples.</span>
                </span>
                <CopyButton value={exported.text} label="Copy" variant="link" size="sm" />
              </div>
              {/* The YAML scrolls, so it is a named, focusable region (WCAG 2.1.1). */}
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
              <pre role="region" tabIndex={0} aria-label={`${exportFile} content`}>{exported.text}</pre>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
