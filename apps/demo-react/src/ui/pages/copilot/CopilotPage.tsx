import '../explore-kit/explore.css';
import { useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import { findCriteriaConflict, validateExampleDraft, type ExampleGroup } from '@/domain/copilot';
import type { Example, Operation } from '@/domain/shared';
import { PageHeader, useAnnounce, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Dialog } from '@/ui/components/ui/dialog';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input, Textarea } from '@/ui/components/ui/input';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import { Progress } from '@/ui/components/ui/progress';
import { Segmented } from '@/ui/components/ui/segmented';
import { Skeleton } from '@/ui/components/ui/skeleton';
import { exampleUrlPath } from '@/domain/catalog';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';
import { pluralize } from '../explore-kit/format';

type Status = 'pending' | 'accepted' | 'rejected';
interface Item { example: Example; status: Status; edited: boolean; expanded: boolean; editing: boolean; draftName: string; draftBody: string; }
interface OpState { phase: 'idle' | 'review'; items: Item[]; }

const COUNTS = [1, 2, 3, 5, 8];
const STAGES = ['Reading the schemas…', 'Drafting examples…', 'Checking dispatch criteria…'];

const fresh = (example: Example, expanded = false): Item => ({ example, status: 'pending', edited: false, expanded, editing: false, draftName: example.name, draftBody: example.response.body });

export default function CopilotPage() {
  const { serviceId = '' } = useParams();
  const [search] = useSearchParams();
  const uc = useUseCases();
  const announce = useAnnounce();
  const service = useQuery(() => uc.catalog.getService(serviceId), [uc, serviceId]);
  const ops = useQuery(() => uc.catalog.listOperations(serviceId), [uc, serviceId]);
  const details = useQuery(() => uc.catalog.getServiceDetails(serviceId), [uc, serviceId]);
  const ctx = useQuery(() => uc.copilot.findWorkflowContext(serviceId, search.get('hint') ?? undefined), [uc, serviceId, search]);
  usePageTitle('AI Copilot examples · Microcks');

  const [opId, setOpId] = useState<string | undefined>(search.get('op') ?? undefined);
  const [count, setCount] = useState(3);
  const [hint, setHint] = useState(search.get('hint') ?? '');
  const [byOp, setByOp] = useState<Record<string, OpState>>({});
  const [generating, setGenerating] = useState<{ opId: string; stage: number } | undefined>();
  const [wfDismissed, setWfDismissed] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'yaml' | 'json'>('yaml');
  const cancelled = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const hintSeed = ctx.data?.criteria.split('=')[1] ?? '';
  const currentOpId = opId ?? ctx.data?.operationId ?? ops.data?.find((o) => o.id === 'get-name')?.id ?? ops.data?.[0]?.id ?? '';
  const existing = useQuery(() => (currentOpId ? uc.catalog.listExamples(serviceId, currentOpId) : Promise.resolve([] as Example[])), [uc, serviceId, currentOpId]);

  if (service.status === 'error' && !service.data) {
    return (<><PageHeader title="AI Copilot" /><ErrorBlock error={service.error} what="The service" onRetry={service.reload} /></>);
  }
  const svc = service.data;
  const operations = ops.data;
  if (!svc || !operations || !existing.data) {
    return (<><PageHeader title="AI Copilot" /><LoadingBlock label="the AI Copilot" /></>);
  }
  const op: Operation | undefined = operations.find((o) => o.id === currentOpId) ?? operations[0];
  if (!op) return (<><PageHeader title="AI Copilot" /><ErrorBlock error={new Error('This service has no operation.')} what="The operation" /></>);

  const state: OpState = byOp[op.id] ?? { phase: 'idle', items: [] };
  const served = existing.data.filter((e) => e.reviewState !== 'pending');
  const patchItem = (opKey: string, id: string, fn: (i: Item) => Item) =>
    setByOp((cur) => {
      const st = cur[opKey] ?? { phase: 'review', items: [] };
      return { ...cur, [opKey]: { ...st, items: st.items.map((i) => (i.example.id === id ? fn(i) : i)) } };
    });
  const counts = (key: string) => {
    const items = byOp[key]?.items ?? [];
    return { accepted: items.filter((i) => i.status === 'accepted').length, pending: items.filter((i) => i.status === 'pending').length };
  };
  const all = Object.values(byOp).flatMap((s) => s.items);
  const sum = { accepted: all.filter((i) => i.status === 'accepted').length, rejected: all.filter((i) => i.status === 'rejected').length, pending: all.filter((i) => i.status === 'pending').length };
  const opsTouched = Object.keys(byOp).filter((k) => (byOp[k]?.items.length ?? 0) > 0);

  const generate = () => {
    cancelled.current = false;
    const key = op.id;
    setGenerating({ opId: key, stage: 0 });
    announce('Generating examples…');
    let stage = 0;
    timer.current = setInterval(() => { stage = Math.min(stage + 1, STAGES.length - 1); setGenerating((g) => (g ? { ...g, stage } : g)); }, 900);
    const kept = (byOp[key]?.items ?? []).filter((i) => i.status === 'accepted');
    void uc.copilot
      .generate({ serviceId, operationId: key, count, hint: hint.trim() || undefined, exclude: kept.map((i) => i.example.name) })
      .then((proposals) => {
        clearInterval(timer.current);
        if (cancelled.current) return;
        setByOp((cur) => ({ ...cur, [key]: { phase: 'review', items: [...kept, ...proposals.map((p, i) => fresh(p, i === 0))] } }));
        setGenerating(undefined);
        announce(`${proposals.length} proposals ready to review.`);
      })
      .catch(() => { clearInterval(timer.current); setGenerating(undefined); });
  };
  const cancel = () => {
    cancelled.current = true;
    clearInterval(timer.current);
    setGenerating(undefined);
    announce('Generation cancelled.');
  };
  const accept = async (item: Item, edited = false) => {
    const example: Example = edited
      ? { ...item.example, name: item.draftName, response: { ...item.example.response, body: item.draftBody } }
      : item.example;
    const stored = await uc.copilot.accept(serviceId, op.id, example);
    patchItem(op.id, item.example.id, (i) => ({ ...i, example: stored, status: 'accepted', edited, editing: false }));
    existing.reload();
    announce(`Accepted ${stored.name}.`);
  };
  const reject = async (item: Item) => {
    await uc.copilot.reject(serviceId, op.id, item.example.id);
    patchItem(op.id, item.example.id, (i) => ({ ...i, status: 'rejected', editing: false }));
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
    for (const i of state.items.filter((x) => x.status === 'pending')) await accept(i);
  };

  const groups: ExampleGroup[] = opsTouched.map((k) => {
    const o = operations.find((x) => x.id === k);
    return { operationKey: `${o?.method} ${o?.path}`, examples: (byOp[k]?.items ?? []).filter((i) => i.status === 'accepted').map((i) => i.example) };
  }).filter((g) => g.examples.length > 0);
  const exported = uc.copilot.exportApiExamples({ name: svc.name, version: svc.version }, groups, exportFormat);
  const pendingItems = state.items.filter((i) => i.status === 'pending');
  const wf = ctx.data && !wfDismissed ? ctx.data : undefined;

  return (
    <div className="ex-stack">
      <PageHeader
        title="AI Copilot"
        eyebrow={<span role="group" aria-label="Breadcrumb"><RouterLink to="/services">APIs &amp; Services</RouterLink> › <RouterLink to={`/services/${svc.id}`}>{svc.name} {svc.version}</RouterLink> › <span aria-current="page">AI Copilot</span></span>}
        badge={<span className="ex-row"><ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} size="sm" /><ApiBadge label="samples" value={String(svc.exampleCount ?? served.length)} size="sm" />{sum.pending > 0 ? <ApiBadge label="" value={`+${sum.pending} AI`} status="info" size="sm" /> : null}</span>}
      />
      {wf ? (
        <Callout
          tone="ai"
          aria-label="Opened from a workflow run"
          actions={<span className="ex-row"><Button asChild size="sm" variant="secondary"><RouterLink to={`/workflows/runs/${wf.runId}`}>Back to the run</RouterLink></Button><Button size="sm" variant="ghost" iconOnly icon="close" aria-label="Dismiss the workflow context" onClick={() => setWfDismissed(true)} /></span>}
        >
          <ApiBadge arazzo name={wf.workflowId} size="sm" /> Opened from workflow <strong>{wf.workflowSummary}</strong> · the mocks lack an example for <code>{wf.criteria}</code> (<code>{wf.arazzoOperationId}</code>)
        </Callout>
      ) : null}
      <p className="ex-secondary" style={{ margin: 0 }}>Generate request and response examples from the contract's schemas when the specification has too few. You review every proposal before it joins the Service.</p>
      <div role="note" className="ex-small"><Icon name="spark" size={14} /> <strong>AI examples are never served by the mock, counted in conformance tests or exported until a person accepts them.</strong> Accepted examples keep an AI provenance tag on the Service.</div>

      <div>
        <div className="ex-stack ex-copilot-layout">
          <div className="ex-stack">
            <Panel title="1 · Operation">
              <fieldset className="ex-fieldset">
                <legend className="di-sr-only">Operation</legend>
                {operations.map((o) => {
                  const c = counts(o.id);
                  return (
                    <label key={o.id} className="ex-radio-card">
                      <input type="radio" name="operation" checked={o.id === op.id} onChange={() => setOpId(o.id)} />
                      <span className="ex-row"><MethodTag method={o.method} protocol={svc.protocol} /><span className="ex-mono">{o.path}</span></span>
                      <span className="ex-small ex-secondary">{o.id === op.id ? served.length : '—'} examples served{c.accepted + c.pending > 0 ? ` · ${c.accepted} accepted, ${c.pending} pending` : ''}</span>
                    </label>
                  );
                })}
              </fieldset>
            </Panel>
            <Panel title="2 · Generation settings">
              <div className="ex-stack">
                <Segmented label="Number of examples" value={String(count)} onChange={(id) => setCount(Number(id))} options={COUNTS.map((n) => ({ id: String(n), label: String(n) }))} />
                <Field label="Hint (optional)" help="Added to the prompt next to the operation and its schemas.">
                  {(c) => <Textarea {...c} rows={3} value={hint} placeholder="Describe the data you want, e.g. edge cases, a locale, a season" onChange={(e) => setHint(e.target.value)} />}
                </Field>
                <p className="ex-small ex-secondary" style={{ margin: 0 }}><strong>Model</strong> OpenAI-compatible endpoint configured by admin (<code>ai-copilot.implementation=openai</code>) · <RouterLink to="/admin">See Administration settings</RouterLink></p>
                <p className="ex-small ex-secondary" style={{ margin: 0 }}><strong>Prompt context</strong> {op.method} {op.path} · schemas of {svc.name} {svc.version} · {served.length} existing examples{details.data ? '' : ''}{hint.trim() ? ' · your hint' : hintSeed ? ` · suggested hint: ${hintSeed}` : ''}</p>
                <div className="ex-row">
                  <Button icon="spark" loading={Boolean(generating)} onClick={generate} disabled={Boolean(generating)}>{state.phase === 'review' ? 'Generate again' : 'Generate examples'}</Button>
                  {generating ? <Button variant="secondary" onClick={cancel}>Cancel generation</Button> : null}
                </div>
                {state.phase === 'review' && !generating ? <span className="ex-small ex-secondary">Generating again replaces pending and rejected proposals. Accepted ones are kept.</span> : null}
              </div>
            </Panel>
          </div>

          <Panel
            title="Proposals"
            id="sec-proposals"
            actions={
              <span className="ex-row">
                <MethodTag method={op.method} protocol={svc.protocol} /><code>{op.path}</code>
                {pendingItems.length > 1 ? <Button size="sm" variant="secondary" onClick={() => void acceptAll()}>Accept all pending</Button> : null}
                {state.items.length > 0 ? <Button size="sm" variant="ghost" onClick={() => { const open = !state.items.every((i) => i.expanded); setByOp((cur) => ({ ...cur, [op.id]: { ...state, items: state.items.map((i) => ({ ...i, expanded: open })) } })); }}>{state.items.every((i) => i.expanded) ? 'Collapse all' : 'Expand all'}</Button> : null}
              </span>
            }
          >
            {generating && generating.opId === op.id ? (
              <div role="status" className="ex-stack" aria-busy="true">
                <p className="ex-row" style={{ margin: 0 }}><LiveIndicator label="live" /> {STAGES[generating.stage]}</p>
                <Progress label="Generating proposals" value={(generating.stage + 1) * 30} max={100} />
                <Skeleton lines={4} />
              </div>
            ) : state.phase === 'idle' ? (
              <div className="ex-stack">
                <strong>No proposal for this operation yet</strong>
                <span className="ex-secondary">Choose a count and press Generate examples. The Copilot reads the schemas of {op.method} {op.path} and drafts {count} request/response pairs for you to review.</span>
              </div>
            ) : (
              <div className="ex-stack">
                {state.items.map((item) => {
                  const e = item.example;
                  const conflict = item.status === 'pending' ? findCriteriaConflict(e, served) : undefined;
                  const draftError = item.editing ? validateExampleDraft({ name: item.draftName, body: item.draftBody }) : undefined;
                  const url = exampleUrlPath(op.path, e.request.params);
                  return (
                    <article key={e.id} aria-label={`${e.name}, ${item.status}`} className="ex-tile">
                      <div className="ex-row-between">
                        <Button variant="ghost" aria-expanded={item.expanded} onClick={() => patchItem(op.id, e.id, (i) => ({ ...i, expanded: !i.expanded }))}>
                          <span className="ex-row"><Chip tone="success">{e.response.status}</Chip><strong>{e.name}</strong><span className="ex-small ex-secondary">{Object.entries(e.request.params).map(([k, v]) => `${k}=${v}`).join(' · ')}</span></span>
                        </Button>
                        <span className="ex-row">
                          {item.status === 'pending' ? <Chip tone="info"><Icon name="spark" size={12} /> Generated by AI, review needed</Chip> : null}
                          {item.status === 'accepted' ? <Chip tone="success"><Icon name="check" size={12} /> Accepted{item.edited ? ' · edited by MA' : ''}</Chip> : null}
                          {item.status === 'rejected' ? <Chip tone="danger"><Icon name="cross" size={12} /> Rejected</Chip> : null}
                          {item.status === 'pending' && !item.editing ? (
                            <>
                              <Button size="sm" onClick={() => void accept(item)} aria-label={`Accept ${e.name}`}>Accept</Button>
                              <Button size="sm" variant="secondary" onClick={() => patchItem(op.id, e.id, (i) => ({ ...i, editing: true, expanded: true }))} aria-label={`Edit ${e.name}`}>Edit</Button>
                              <Button size="sm" variant="secondary" onClick={() => void reject(item)} aria-label={`Reject ${e.name}`}>Reject</Button>
                            </>
                          ) : null}
                          {item.status !== 'pending' ? <Button size="sm" variant="ghost" icon="undo" onClick={() => void undo(item)} aria-label={`Undo for ${e.name}`}>Undo</Button> : null}
                        </span>
                      </div>
                      {conflict ? <Callout tone="warning" live="polite">{conflict}</Callout> : null}
                      {item.expanded && !item.editing ? (
                        <div className="ex-grid ex-grid-2-even">
                          <div className="ex-stack">
                            <CodeBlock code={`${op.method} ${url}`} caption="Request" />
                            {e.request.body ? <CodeBlock code={e.request.body} language="json" caption="Request body" /> : null}
                          </div>
                          <CodeBlock code={e.response.body} language="json" caption={`Response · ${e.response.status} application/json`} maxHeight={260} />
                        </div>
                      ) : null}
                      {item.editing ? (
                        <div className="ex-stack">
                          <Field label="Example name">{(c) => <Input {...c} value={item.draftName} onChange={(ev) => patchItem(op.id, e.id, (i) => ({ ...i, draftName: ev.target.value }))} />}</Field>
                          <p className="ex-small ex-secondary" style={{ margin: 0 }}>Request <code>{op.method} {url}</code></p>
                          <Field label="Response body · application/json" error={draftError}>{(c) => <Textarea {...c} mono spellCheck={false} rows={Math.min(14, item.draftBody.split('\n').length + 1)} value={item.draftBody} onChange={(ev) => patchItem(op.id, e.id, (i) => ({ ...i, draftBody: ev.target.value }))} />}</Field>
                          <div className="ex-row">
                            <Button disabled={Boolean(draftError)} onClick={() => void accept(item, true)}>Apply and accept</Button>
                            <Button variant="secondary" onClick={() => patchItem(op.id, e.id, (i) => ({ ...i, editing: false, draftName: i.example.name, draftBody: i.example.response.body }))}>Cancel edit</Button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
            <div className="ex-sticky-bar ex-row-between" style={{ marginTop: 12 }}>
              <p className="ex-row" role="status" style={{ margin: 0 }}>
                <span><strong>{sum.accepted}</strong> accepted</span><span aria-hidden="true">·</span>
                <span><strong>{sum.rejected}</strong> rejected</span><span aria-hidden="true">·</span>
                <span><strong>{sum.pending}</strong> pending</span>
                {opsTouched.length > 1 ? <span className="ex-small ex-secondary">across {opsTouched.length} operations</span> : null}
              </p>
              <span className="ex-row">
                <Button variant="secondary" disabled={sum.accepted === 0} aria-haspopup="dialog" onClick={() => setExportOpen(true)}>Export accepted examples (APIExamples)</Button>
                {sum.accepted > 0 ? <Button asChild><RouterLink to={`/services/${svc.id}?op=${op.id}`}>Add {pluralize(sum.accepted, 'accepted example')} to the Service</RouterLink></Button> : <span className="ex-small ex-muted" aria-disabled="true">Accept a proposal to add it</span>}
              </span>
            </div>
            {sum.pending > 0 ? <p className="ex-small ex-secondary" style={{ marginBottom: 0 }}>{pluralize(sum.pending, 'proposal')} still pending: the mock will not serve {sum.pending === 1 ? 'it' : 'them'} until accepted.</p> : null}
          </Panel>
        </div>
      </div>

      <Dialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export accepted examples"
        description={`${svc.name.toLowerCase().replace(/\s+/g, '-')}-${svc.version}-examples.${exportFormat}. Secondary artifact: re-import it on another Microcks to share these examples.`}
        size="lg"
        footer={<><CopyButton value={exported.text} label="Copy" /><Button variant="secondary" onClick={() => setExportOpen(false)}>Close</Button></>}
      >
        <Segmented label="Format" value={exportFormat} onChange={(id) => setExportFormat(id as 'yaml' | 'json')} options={[{ id: 'yaml', label: 'YAML' }, { id: 'json', label: 'JSON' }]} />
        <CodeBlock code={exported.text} language={exportFormat} caption="APIExamples artifact" maxHeight={360} />
      </Dialog>
    </div>
  );
}
