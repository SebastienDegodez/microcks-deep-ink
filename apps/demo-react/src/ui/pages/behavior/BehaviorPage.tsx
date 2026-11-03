import '../explore-kit/explore.css';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import {
  isValidRegExp, parseJsonBodyRule, reachability, ruleNames, scriptSample, storedAs,
  type Behavior, type BehaviorDispatcher, type ParameterConstraint, type SimulationResult,
} from '@/domain/catalog';
import { PageHeader, useAnnounce, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input, Textarea } from '@/ui/components/ui/input';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import { Segmented } from '@/ui/components/ui/segmented';
import { Select } from '@/ui/components/ui/select';
import { Switch } from '@/ui/components/ui/switch';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';

const CARDS: { id: BehaviorDispatcher; desc: string; tag?: string; disabled?: boolean }[] = [
  { id: 'URI_PARTS', desc: 'Matches path segments, here {name}.', tag: 'inferred from contract' },
  { id: 'URI_PARAMS', desc: 'Matches query parameter values.' },
  { id: 'QUERY_ARGS' as BehaviorDispatcher, desc: 'Matches GraphQL or gRPC arguments.', tag: 'GraphQL & gRPC only', disabled: true },
  { id: 'JSON_BODY', desc: 'Evaluates a JSON Pointer in the request body.' },
  { id: 'SCRIPT', desc: 'Groovy or JavaScript returns the example name.' },
  { id: 'FALLBACK', desc: 'A dispatcher, plus a default example when nothing matches.' },
  { id: 'PROXY_FALLBACK', desc: 'A dispatcher, else forwards to the real backend.' },
];
const SIM_PRESETS = ['/pastries/Eclair%20Cafe', '/pastries/Millefeuille', '/pastries/Kouign-amann', '/pastries/Eclair%20Chocolat?size=XL'];
const DELAY_PRESETS = [0, 100, 250, 500, 1000];
const JSON_RULE_SAMPLE = JSON.stringify({ exp: '/name', operator: 'equals', cases: { Millefeuille: 'Millefeuille', 'Eclair Cafe': 'Eclair Cafe', default: 'Millefeuille' } }, null, 2);

interface HistoryItem { id: number; path: string; code: string; what: string; }

export default function BehaviorPage() {
  const { serviceId = '', operationId = '' } = useParams();
  const uc = useUseCases();
  const announce = useAnnounce();
  const service = useQuery(() => uc.catalog.getService(serviceId), [uc, serviceId]);
  const op = useQuery(() => uc.catalog.getOperation(serviceId, operationId), [uc, serviceId, operationId]);
  const saved = useQuery(() => uc.catalog.behavior(serviceId, operationId), [uc, serviceId, operationId]);
  const examples = useQuery(() => uc.catalog.listExamples(serviceId, operationId), [uc, serviceId, operationId]);
  usePageTitle(op.data ? `${op.data.method} ${op.data.path} behavior · Microcks` : 'Operation behavior · Microcks');

  const [edits, setEdits] = useState<{ key: string; value: Behavior } | undefined>();
  const editKey = `${serviceId}/${operationId}`;
  const draft = edits?.key === editKey ? edits.value : saved.data;
  const setDraft = (value: Behavior | undefined) => setEdits(value ? { key: editKey, value } : undefined);
  const [simPath, setSimPath] = useState('/pastries/Eclair%20Cafe');
  const [sendKey, setSendKey] = useState(true);
  const [sim, setSim] = useState<SimulationResult | undefined>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [switched, setSwitched] = useState(false);
  const [store, setStore] = useState<Record<string, number>>({});
  const [savedAt, setSavedAt] = useState(false);

  const dirty = useMemo(() => Boolean(draft && saved.data && JSON.stringify(draft) !== JSON.stringify(saved.data)), [draft, saved.data]);
  const jsonCheck = useMemo(() => (draft?.dispatcher === 'JSON_BODY' ? parseJsonBodyRule(draft.rule) : undefined), [draft]);

  if (op.status === 'error' && !op.data) {
    return (<><PageHeader title="Operation behavior" /><ErrorBlock error={op.error} what="The operation" onRetry={op.reload} /></>);
  }
  const svc = service.data;
  const operation = op.data;
  if (!svc || !operation || !draft || !examples.data) {
    return (<><PageHeader title="Operation behavior" /><LoadingBlock label="the operation behavior" /></>);
  }
  const exs = examples.data;
  const pathParams = [...operation.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1] as string);
  const edit = (patch: Partial<Behavior>) => { setDraft({ ...draft, ...patch }); setSavedAt(false); };
  const pickDispatcher = (id: BehaviorDispatcher) => {
    const patch: Partial<Behavior> = { dispatcher: id };
    if (id === 'JSON_BODY' && 'error' in parseJsonBodyRule(draft.rule)) patch.rule = JSON_RULE_SAMPLE;
    if (id === 'SCRIPT' && !draft.script) { patch.script = scriptSample(draft.scriptLanguage ?? 'GROOVY', draft.stateful); patch.scriptLanguage = draft.scriptLanguage ?? 'GROOVY'; }
    if ((id === 'URI_PARTS' || id === 'URI_PARAMS') && draft.rule.trim().startsWith('{')) patch.rule = id === 'URI_PARTS' ? (pathParams[0] ?? '') : '';
    if (id === 'FALLBACK' && !draft.fallback) patch.fallback = exs[0]?.name;
    if (id === 'PROXY_FALLBACK' && !draft.proxyUrl) patch.proxyUrl = 'https://pastry.staging.acme.io/v2';
    edit(patch);
  };
  const toggleStateful = (on: boolean) => {
    if (on) {
      const lang = draft.scriptLanguage ?? 'GROOVY';
      edit({ stateful: true, dispatcher: 'SCRIPT', scriptLanguage: lang, script: scriptSample(lang, true) });
      setSwitched(true);
      announce('Stateful mock on. Dispatcher switched to SCRIPT with a view-counter sample.');
    } else {
      edit({ stateful: false });
      setSwitched(false);
    }
  };
  const setConstraint = (i: number, patch: Partial<ParameterConstraint>) =>
    edit({ constraints: draft.constraints.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const run = async (path: string) => {
    setSimPath(path);
    const headers = sendKey ? { 'x-api-key': 'demo-7f3a' } : undefined;
    const result = await uc.catalog.simulate(serviceId, operationId, { path, params: {}, headers, store }, draft);
    setSim(result);
    if (result.storeKey) setStore((s) => ({ ...s, [result.storeKey as string]: (s[result.storeKey as string] ?? 0) + 1 }));
    setHistory((h) => [{ id: Date.now() + h.length, path, code: result.status === null ? 'fwd' : String(result.status), what: result.chain }, ...h].slice(0, 6));
    announce(`Simulation: ${result.statusLabel}.`);
  };
  const save = async () => {
    await uc.catalog.saveBehavior(serviceId, operationId, draft);
    saved.reload();
    setSavedAt(true);
    announce('Behavior saved.');
  };
  const reach = reachability(draft, exs);
  const names = ruleNames(draft.rule);
  const baseLine = (
    <div className="ex-row">
      <span className="ex-secondary">1 · First try</span> <code>{draft.baseDispatcher ?? 'URI_PARTS'}</code> <span className="ex-muted">· {draft.rule}</span> <Icon name="arrow-down" size={14} />
    </div>
  );

  return (
    <div className="ex-stack">
      <PageHeader
        title={operation.path}
        eyebrow={
          <span role="group" aria-label="Breadcrumb">
            <RouterLink to="/services">APIs &amp; Services</RouterLink> › <RouterLink to={`/services/${svc.id}`}>{svc.name} {svc.version}</RouterLink> › <span aria-current="page">{operation.method} {operation.path}</span>
          </span>
        }
        badge={<span className="ex-row"><MethodTag method={operation.method} protocol={svc.protocol} /><ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} size="sm" /></span>}
        actions={
          <>
            {dirty ? <span className="ex-row"><Icon name="warning" size={14} /> Unsaved changes <Button size="sm" variant="ghost" onClick={() => { setEdits(undefined); setSwitched(false); }}>Reset</Button></span> : null}
            <Button asChild variant="secondary"><RouterLink to={`/services/${svc.id}`}>Cancel</RouterLink></Button>
            <Button icon="check" disabled={!dirty} onClick={() => void save()}>Save behavior</Button>
          </>
        }
      />
      <p className="ex-secondary" style={{ margin: 0 }}>Mock behavior: how Microcks picks a response for each incoming call, how long it waits, which parameters it checks and whether it keeps state. Try every change in the simulator before saving.</p>
      <div role="note" className="ex-row ex-small">
        <strong>Saved</strong>
        <span>{saved.data?.dispatcher} · rule: {saved.data?.rule || '(none)'}</span> <span aria-hidden="true">•</span>
        <span>delay {saved.data?.delayMs} ms {saved.data?.delayStrategy ?? 'fixed'}</span> <span aria-hidden="true">•</span>
        <span>{saved.data?.constraints.length} constraints</span> <span aria-hidden="true">•</span>
        <span>{exs.length} examples · dispatcher inferred from the OpenAPI path parameter</span>
        {savedAt ? <span role="status"><Icon name="check" size={14} /> Behavior saved</span> : null}
      </div>

      <div className="ex-grid ex-grid-2">
        <div className="ex-stack">
          <Panel title="Dispatcher" id="sec-dispatcher" actions={<a href="https://microcks.io/documentation/explanations/dispatching/" target="_blank" rel="noreferrer">Dispatching reference</a>}>
            <p className="ex-secondary" style={{ marginTop: 0 }}>Turns an incoming request into dispatch criteria, then into the example to return.</p>
            <fieldset className="ex-fieldset">
              <legend className="di-sr-only">Dispatcher type</legend>
              <div className="ex-radio-cards">
                {CARDS.map((c) => (
                  <label key={c.id} className="ex-radio-card" aria-disabled={c.disabled || undefined}>
                    <input type="radio" name="dispatcher" value={c.id} checked={draft.dispatcher === c.id} disabled={c.disabled} onChange={() => pickDispatcher(c.id)} />
                    <span className="ex-radio-card-title ex-row">{c.id}{draft.dispatcher === c.id ? <Icon name="check" size={14} /> : null}</span>
                    <span className="ex-small ex-secondary">{c.desc}</span>
                    {c.tag ? <span className="ex-small ex-muted">{c.tag}</span> : null}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="ex-small ex-secondary">Also available as raw rules: <code>URI_ELEMENTS · QUERY_HEADER · QUERY_MATCH · PROXY · SEQUENCE</code></p>

            <h3>Rules</h3>
            {draft.dispatcher === 'URI_PARTS' ? (
              <div className="ex-stack">
                <span id="parts-label">Path parameters used as criteria</span>
                <div className="ex-row" role="group" aria-labelledby="parts-label">
                  {pathParams.map((p) => (
                    <Button key={p} size="sm" variant="secondary" aria-pressed={names.includes(p)} aria-label={`Use path parameter ${p} as dispatch criteria`} onClick={() => edit({ rule: (names.includes(p) ? names.filter((n) => n !== p) : [...names, p]).join(' && ') })}>
                      {`{${p}}`}
                    </Button>
                  ))}
                </div>
                <span className="ex-small ex-secondary">Click a path parameter to include or exclude it. Several parameters are joined with <code>&amp;&amp;</code>.</span>
              </div>
            ) : null}
            {draft.dispatcher === 'URI_PARAMS' ? (
              <div className="ex-stack">
                <Field label="Query parameters used as criteria" help="Names separated by &&, for example size && page.">{(c) => <Input {...c} mono value={draft.rule} onChange={(e) => edit({ rule: e.target.value })} />}</Field>
                <Callout tone="warning">The contract declares no query parameter on this operation. The {exs.length} imported examples carry no query criteria, so every call returns 404 until you add examples that do.</Callout>
              </div>
            ) : null}
            {draft.dispatcher === 'JSON_BODY' ? (
              <div className="ex-stack">
                <Field label="Expression, operator and cases" error={jsonCheck && 'error' in jsonCheck ? jsonCheck.error : undefined}>
                  {(c) => <Textarea {...c} mono rows={9} spellCheck={false} value={draft.rule} onChange={(e) => edit({ rule: e.target.value })} />}
                </Field>
                <span className="ex-small ex-secondary">Operators: <code>equals · range · size · regexp · presence</code>. A <code>default</code> case is required. GET requests carry no body here, so only the default case can apply.</span>
              </div>
            ) : null}
            {draft.dispatcher === 'SCRIPT' ? (
              <div className="ex-stack">
                <Segmented label="Script language" value={draft.scriptLanguage ?? 'GROOVY'} onChange={(id) => edit({ scriptLanguage: id as 'GROOVY' | 'JS', script: scriptSample(id as 'GROOVY' | 'JS', draft.stateful) })} options={[{ id: 'GROOVY', label: 'Groovy' }, { id: 'JS', label: 'JavaScript' }]} />
                <span className="ex-small ex-secondary">In scope: <code>mockRequest</code> <code>requestContext</code> <code>store</code> <code>log</code></span>
                <Field label="Dispatcher script">{(c) => <Textarea {...c} mono rows={Math.min(16, Math.max(8, (draft.script ?? '').split('\n').length + 1))} spellCheck={false} wrap="off" value={draft.script ?? ''} onChange={(e) => edit({ script: e.target.value })} />}</Field>
                <span className="ex-small ex-secondary">The script returns the name of the example to serve. Use <code>log.info()</code> to trace it in the mock logs.</span>
              </div>
            ) : null}
            {draft.dispatcher === 'FALLBACK' ? (
              <div className="ex-stack">
                {baseLine}
                <Field label="2 · If nothing matches, serve" help="Without a fallback, an unknown pastry name returns 404.">
                  {(c) => (
                    <Select {...c} value={draft.fallback ?? ''} onChange={(e) => edit({ fallback: e.target.value || undefined })}>
                      <option value="">No fallback</option>
                      {exs.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
                    </Select>
                  )}
                </Field>
              </div>
            ) : null}
            {draft.dispatcher === 'PROXY_FALLBACK' ? (
              <div className="ex-stack">
                {baseLine}
                <Field label="2 · Else forward to (proxyUrl)" help="Microcks keeps the path and query, swaps the base URL, and returns the real backend's response.">
                  {(c) => <Input {...c} type="url" mono value={draft.proxyUrl ?? ''} onChange={(e) => edit({ proxyUrl: e.target.value })} />}
                </Field>
              </div>
            ) : null}

            {draft.dispatcher !== 'SCRIPT' && draft.dispatcher !== 'JSON_BODY' ? (
              <div className="ex-stack" style={{ marginTop: 12 }}>
                <div className="ex-row-between"><strong>Examples and their dispatch criteria</strong><span className="ex-small ex-secondary">{reach.filter((r) => r.reachable).length} of {reach.length} reachable</span></div>
                <ul className="ex-plain-list">
                  {reach.map((r) => (
                    <li key={r.name} className="ex-row-between">
                      <span>{r.name}</span><code className="ex-small">{r.criteria}</code>
                      <span className="ex-row ex-small"><Icon name={r.reachable ? 'check' : 'cross'} size={14} />{r.reachable ? 'Reachable' : 'Unreachable'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <CodeBlock code={storedAs(draft)} caption="Stored as" />
          </Panel>

          <Panel title="Delay" id="sec-delay">
            <p className="ex-secondary" style={{ marginTop: 0 }}>Simulates the dependency's response time. Applies to every call unless the caller overrides it.</p>
            <div className="ex-row">
              <Field label="Default delay (range)">{(c) => <Input {...c} type="range" min={0} max={2000} step={50} value={draft.delayMs} onChange={(e) => edit({ delayMs: Number(e.target.value) })} />}</Field>
              <Field label="Default delay in milliseconds">{(c) => <Input {...c} type="number" min={0} step={50} value={draft.delayMs} onChange={(e) => edit({ delayMs: Math.max(0, Number(e.target.value) || 0) })} />}</Field>
            </div>
            <div className="ex-row" role="group" aria-label="Presets">
              {DELAY_PRESETS.map((v) => <Button key={v} size="sm" variant="secondary" aria-pressed={draft.delayMs === v} onClick={() => edit({ delayMs: v })}>{v} ms</Button>)}
            </div>
            <Segmented label="Strategy" value={draft.delayStrategy ?? 'fixed'} onChange={(id) => edit({ delayStrategy: id as 'fixed' | 'random' })} options={[{ id: 'fixed', label: 'fixed' }, { id: 'random', label: 'random' }]} />
            <p className="ex-small ex-secondary">
              {draft.delayMs === 0 ? 'No delay: responses return immediately.' : (draft.delayStrategy ?? 'fixed') === 'fixed' ? `Every response waits exactly ${draft.delayMs} ms.` : `The wait varies on every call, based on ${draft.delayMs} ms. Use random-N in the raw value to bound the range.`}
            </p>
            <p className="ex-small ex-secondary">Per endpoint: <code>?delay=500</code> · Per request: <code>x-microcks-delay: 800</code> header, wins over all others</p>
          </Panel>

          <Panel title="Parameter constraints" id="sec-constraints" actions={<span className="ex-small ex-secondary">{draft.constraints.length} {draft.constraints.length === 1 ? 'constraint' : 'constraints'}</span>}>
            <p className="ex-secondary" style={{ marginTop: 0 }}>Expectations the contract cannot express. A violated constraint returns 400 before dispatching.</p>
            <div className="ex-small" style={{ overflowX: 'auto' }}>
              <table className="di-table" aria-label="Parameter constraints">
                <thead><tr><th scope="col">In</th><th scope="col">Name</th><th scope="col">Required</th><th scope="col">Recopy</th><th scope="col">Must match regexp</th><th scope="col"><span className="di-sr-only">Remove</span></th></tr></thead>
                <tbody>
                  {draft.constraints.map((c, i) => {
                    const invalid = Boolean(c.mustMatchRegexp) && !isValidRegExp(c.mustMatchRegexp ?? '');
                    const who = c.name || `constraint ${i + 1}`;
                    return (
                      <tr key={i}>
                        <td><Select aria-label={`Location of ${who}`} value={c.in} onChange={(e) => setConstraint(i, { in: e.target.value as ParameterConstraint['in'] })}><option value="header">header</option><option value="query">query</option></Select></td>
                        <td><Input aria-label={`Name of ${who}`} placeholder="parameter name" value={c.name} onChange={(e) => setConstraint(i, { name: e.target.value })} /></td>
                        <td><Checkbox label={<span className="di-sr-only">{`${who} is required`}</span>} checked={c.required} onChange={(e) => setConstraint(i, { required: e.target.checked })} /></td>
                        <td><Checkbox label={<span className="di-sr-only">{`Recopy ${who}`}</span>} checked={Boolean(c.recopy)} onChange={(e) => setConstraint(i, { recopy: e.target.checked })} /></td>
                        <td>
                          <Input aria-label={`Regular expression for ${who}`} placeholder="no pattern" aria-invalid={invalid || undefined} value={c.mustMatchRegexp ?? ''} onChange={(e) => setConstraint(i, { mustMatchRegexp: e.target.value || undefined })} />
                          {invalid ? <span className="ex-small"><Icon name="warning" size={12} /> Invalid regular expression</span> : null}
                        </td>
                        <td><Button iconOnly icon="trash" size="sm" variant="ghost" aria-label={`Remove ${who}`} onClick={() => edit({ constraints: draft.constraints.filter((_, j) => j !== i) })} /></td>
                      </tr>
                    );
                  })}
                  {draft.constraints.length === 0 ? <tr><td colSpan={6}>No constraint: every header and query value is accepted.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <div className="ex-row" style={{ marginTop: 8 }}>
              <Button size="sm" variant="secondary" icon="plus" onClick={() => edit({ constraints: [...draft.constraints, { in: 'header', name: '', required: false, recopy: false } as unknown as ParameterConstraint] })}>Add constraint</Button>
              <span className="ex-small ex-secondary"><code>recopy</code> echoes the value in a response header, e.g. a correlation id.</span>
            </div>
          </Panel>

          <Panel title="Stateful mock" id="sec-stateful">
            <Switch label="Stateful mock" description="Persist state between calls, e.g. count views, keep a cart, reflect a PATCH in later GETs." checked={draft.stateful} onChange={toggleStateful} />
            <ul className="ex-plain-list ex-small ex-secondary" style={{ marginTop: 8 }}>
              <li><strong>Runs in a SCRIPT dispatcher.</strong> Turning it on switches the dispatcher to SCRIPT and loads a sample that reads and writes the <code>store</code>.</li>
              <li><strong>Scoped to {svc.name} {svc.version}.</strong> The key/value store is shared by its operations, never by other APIs.</li>
              <li><strong>Values expire.</strong> Default time-to-live is 10 s; set another with <code>store.put(key, value, ttl)</code>.</li>
            </ul>
            {switched ? <Callout tone="info" live="polite">Dispatcher switched to SCRIPT with a view-counter sample. Responses can read <code>{'{{ views }}'}</code> from the request context.</Callout> : null}
          </Panel>
        </div>

        <Panel title="Request simulator" id="sec-sim">
          <p className="ex-secondary" style={{ marginTop: 0 }}>Dry run against the configuration on this page, saved or not. Nothing reaches the live mock.</p>
          <form className="ex-stack" onSubmit={(e) => { e.preventDefault(); void run(simPath); }}>
            <Field label="Request" help="http://microcks.local:8080/rest/API+Pastry/2.0 + path">
              {(c) => <div className="ex-row" style={{ flexWrap: 'nowrap' }}><MethodTag method={operation.method} protocol={svc.protocol} /><Input {...c} mono spellCheck={false} value={simPath} onChange={(e) => setSimPath(e.target.value)} /></div>}
            </Field>
            <div className="ex-row" role="group" aria-label="Request examples">
              {SIM_PRESETS.map((p) => <Button key={p} type="button" size="sm" variant="secondary" onClick={() => void run(p)}>{p}</Button>)}
            </div>
            <Checkbox label={<>Send header <code>x-api-key: demo-7f3a</code></>} checked={sendKey} onChange={(e) => setSendKey(e.target.checked)} />
            <div><Button type="submit" icon="play">Simulate</Button></div>
          </form>
          <div role="status" aria-live="polite" className="ex-stack" style={{ marginTop: 12 }}>
            {sim ? (
              <>
                <p className="ex-row" style={{ margin: 0 }}>
                  <Icon name={sim.status === null ? 'running' : sim.status < 300 ? 'check' : 'cross'} size={16} />
                  <strong>{sim.requestLine}</strong> <span>{sim.statusLabel}</span>
                </p>
                <p className="ex-mono ex-small" style={{ margin: 0 }}>{sim.chain}</p>
                <ol className="ex-plain-list">
                  {sim.steps.map((s, i) => (
                    <li key={i} className="ex-row ex-small">
                      <Icon name={s.kind === 'ok' ? 'check' : s.kind === 'fail' ? 'cross' : s.kind === 'warn' ? 'warning' : s.kind === 'skip' ? 'dash' : 'info'} size={14} />
                      <strong>{s.label}</strong> <span className="ex-secondary">{s.value}</span>
                    </li>
                  ))}
                </ol>
                <CodeBlock code={sim.headers.join('\n')} caption={`Response headers · ${sim.mediaType}`} />
                <CodeBlock code={sim.body} language="json" caption="Response body" copy maxHeight={220} />
              </>
            ) : <p className="ex-muted">Pick a request above or type one, then press Simulate.</p>}
          </div>
          {history.length ? (
            <div className="ex-stack" style={{ marginTop: 12 }}>
              <div className="ex-row-between"><strong>Recent runs</strong><Button size="sm" variant="ghost" onClick={() => setHistory([])}>Clear</Button></div>
              <ul className="ex-plain-list">
                {history.map((h) => (
                  <li key={h.id}><Button variant="ghost" size="sm" onClick={() => void run(h.path)}><span className="ex-row"><strong>{h.code}</strong> <code>{h.path}</code> <span className="ex-small ex-secondary">{h.what}</span></span></Button></li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
