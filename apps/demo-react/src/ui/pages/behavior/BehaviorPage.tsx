import '../explore-kit/explore.css';
import './behavior.css';
import './config.css';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import {
  isValidRegExp, scriptSample, storedSummary, type Behavior, type ParameterConstraint,
} from '@/domain/catalog';
import { PageHeader, useAnnounce, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import { Segmented } from '@/ui/components/ui/segmented';
import { SplitPane, SplitPaneMain, SplitPaneSide } from '@/ui/components/ui/split-pane';
import { SummaryStrip } from '@/ui/components/ui/summary-strip';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { DispatcherPanel } from './DispatcherPanel';
import { SimulatorPanel } from './SimulatorPanel';

const DELAY_PRESETS = [0, 100, 250, 500, 1000];

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
  const [switched, setSwitched] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  // What was just saved, shown at once while the saved query reloads.
  const [justSaved, setJustSaved] = useState<{ key: string; value: Behavior } | undefined>();
  const current = justSaved?.key === editKey ? justSaved.value : saved.data;

  const dirty = useMemo(() => Boolean(draft && current && JSON.stringify(draft) !== JSON.stringify(current)), [draft, current]);

  if (op.status === 'error' && !op.data) {
    return (<><PageHeader title="Operation behavior" /><ErrorBlock error={op.error} what="The operation" onRetry={op.reload} /></>);
  }
  const svc = service.data;
  const operation = op.data;
  if (!svc || !operation || !draft || !examples.data) {
    return (<><PageHeader title="Operation behavior" /><LoadingBlock label="the operation behavior" /></>);
  }
  // A pending AI example is not served until it is accepted, so it does not count here.
  const exs = examples.data.filter((e) => e.reviewState !== 'pending');
  const pathParams = [...operation.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1] as string);
  const edit = (patch: Partial<Behavior>) => { setDraft({ ...draft, ...patch }); setSavedAt(false); };
  const toggleStateful = (on: boolean) => {
    if (on) {
      const lang = draft.scriptLanguage ?? 'GROOVY';
      edit({ stateful: true, dispatcher: 'SCRIPT', scriptLanguage: lang, script: scriptSample(lang, true) });
      setSwitched(true);
      announce('Stateful mock on. Dispatcher switched to SCRIPT with a view-counter sample.');
    } else {
      // Back to the plain sample of the language; the counters of the store are dropped with it.
      edit({ stateful: false, script: scriptSample(draft.scriptLanguage ?? 'GROOVY', false) });
      setSwitched(false);
    }
  };
  // The contract infers URI_PARTS on the path parameters; say so only while that is what is saved.
  const inferred = current?.dispatcher === 'URI_PARTS' && current.rule === pathParams.join(' && ');
  const headerCount = draft.constraints.filter((c) => c.in === 'header').length;
  const counts = `${headerCount} header · ${draft.constraints.length - headerCount} query`;
  const setConstraint = (i: number, patch: Partial<ParameterConstraint>) =>
    edit({ constraints: draft.constraints.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const save = async () => {
    await uc.catalog.saveBehavior(serviceId, operationId, draft);
    setJustSaved({ key: editKey, value: draft });
    saved.reload();
    setSavedAt(true);
    announce('Behavior saved.');
  };

  return (
    <div className="behavior-page">
      <div className="behavior-head">
        <PageHeader
          title={operation.path}
          variant="mono"
          align="start"
          breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${svc.name} ${svc.version}`, to: `/services/${svc.id}` }, { label: <span className="ex-mono">{`${operation.method} ${operation.path}`}</span> }]}
          leading={<MethodTag method={operation.method} protocol={svc.protocol} />}
          badge={<RouterLink to={`/services/${svc.id}`} className="behavior-api-link"><ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} size="sm" /></RouterLink>}
          description="Mock behavior: how Microcks picks a response for each incoming call, how long it waits, which parameters it checks and whether it keeps state. Try every change in the simulator before saving."
          descriptionTone="secondary"
          actions={
            <>
              {dirty ? <span className="behavior-unsaved"><Icon name="alert-circle" size={14} />Unsaved changes</span> : null}
              <Button variant="ghost" onClick={() => { setEdits(undefined); setSwitched(false); }}>Reset</Button>
              <Button asChild variant="secondary"><RouterLink to={`/services/${svc.id}`}>Cancel</RouterLink></Button>
              <Button variant="primary" icon="check" onClick={() => void save()}>Save behavior</Button>
            </>
          }
        />
        <SummaryStrip
          role="note"
          aria-label="Saved behavior"
          parts={[
            { text: 'Saved', kind: 'label' },
            { text: current ? storedSummary(current) : '' },
            { text: `delay ${current?.delayMs} ms ${current?.delayStrategy ?? 'fixed'}`, sep: true },
            { text: `${current?.constraints.length} constraints`, sep: true },
            { text: `${exs.length} examples${inferred ? ' · dispatcher inferred from the OpenAPI path parameter' : ''}`, kind: 'label', sep: true },
          ]}
        >
          {savedAt ? <span role="status" className="behavior-saved"><Icon name="check" size={14} />Behavior saved</span> : null}
        </SummaryStrip>
      </div>

      <SplitPane className="behavior-layout" sideWidth="360px" sideMax="480px" mainWidth="600px" keepSideMax>
        <SplitPaneMain className="behavior-config">
          <DispatcherPanel draft={draft} examples={exs} pathParams={pathParams} pathPrefix={operation.path.split('{')[0] ?? '/'} edit={edit} />

          <Panel padding="lg" title="Delay" id="sec-delay" className="delay">
            <p className="panel-lead">Simulates the dependency's response time. Applies to every call unless the caller overrides it.</p>
            <div className="delay-row">
              <label htmlFor="delay-range" className="field-inline-label">Default delay</label>
              <input id="delay-range" className="delay-range" type="range" min={0} max={2000} step={50} value={draft.delayMs} onChange={(e) => edit({ delayMs: Number(e.target.value) })} />
              <span className="delay-ms">
                <input className="delay-number" type="number" min={0} step={50} aria-label="Default delay in milliseconds" value={draft.delayMs} onChange={(e) => edit({ delayMs: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                <span aria-hidden="true">ms</span>
              </span>
            </div>
            <div className="delay-presets" role="group" aria-labelledby="delay-presets">
              <span id="delay-presets" className="delay-presets-label">Presets</span>
              {DELAY_PRESETS.map((v) => <button key={v} type="button" className="mono-chip" aria-pressed={draft.delayMs === v} onClick={() => edit({ delayMs: v })}>{v} ms</button>)}
            </div>
            <div className="delay-strategy">
              <span className="field-inline-label" aria-hidden="true">Strategy</span>
              <Segmented variant="joined" size="sm" label="Strategy" value={draft.delayStrategy ?? 'fixed'} onChange={(id) => edit({ delayStrategy: id as 'fixed' | 'random' })} options={[{ id: 'fixed', label: 'fixed' }, { id: 'random', label: 'random' }]} />
              <span className="delay-help">
                {draft.delayMs === 0 ? 'No delay: responses return immediately.' : (draft.delayStrategy ?? 'fixed') === 'fixed' ? `Every response waits exactly ${draft.delayMs} ms.` : `The wait varies on every call, based on ${draft.delayMs} ms. Use random-N in the raw value to bound the range.`}
              </span>
            </div>
            <p className="delay-overrides">
              <span>Per endpoint: <code>?delay=500</code></span>
              <span>Per request: <code>x-microcks-delay: 800</code> header, wins over all others</span>
            </p>
          </Panel>

          <Panel padding="lg" title="Parameter constraints" id="sec-constraints" className="constraints" actions={<span className="constraints-count">{counts}</span>}>
            <p className="panel-lead">Expectations the contract cannot express. A violated constraint returns 400 before dispatching.</p>
            <div className="constraints-frame">
              <table className="constraints-table" aria-label="Parameter constraints">
                <thead>
                  <tr>
                    <th scope="col">In</th><th scope="col">Name</th><th scope="col" className="is-center">Required</th><th scope="col" className="is-center">Recopy</th>
                    <th scope="col">Must match regexp</th><th scope="col"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.constraints.map((c, i) => {
                    const invalid = Boolean(c.mustMatchRegexp) && !isValidRegExp(c.mustMatchRegexp ?? '');
                    const who = c.name || `constraint ${i + 1}`;
                    return (
                      <tr key={i}>
                        <td>
                          <select className="cell-control" aria-label={`Location of ${who}`} value={c.in} onChange={(e) => setConstraint(i, { in: e.target.value as ParameterConstraint['in'] })}>
                            <option value="header">header</option><option value="query">query</option>
                          </select>
                        </td>
                        <td><input className="cell-control" type="text" aria-label={`Name of ${who}`} placeholder="parameter name" value={c.name} onChange={(e) => setConstraint(i, { name: e.target.value })} /></td>
                        <td className="is-center"><input type="checkbox" className="checkbox" aria-label={`${who} is required`} checked={c.required} onChange={(e) => setConstraint(i, { required: e.target.checked })} /></td>
                        <td className="is-center"><input type="checkbox" className="checkbox" aria-label={`Recopy ${who}`} checked={Boolean(c.recopy)} onChange={(e) => setConstraint(i, { recopy: e.target.checked })} /></td>
                        <td>
                          <input
                            className="cell-control cell-regexp"
                            type="text"
                            aria-label={`Regular expression for ${who}`}
                            placeholder="no pattern"
                            aria-invalid={invalid || undefined}
                            aria-describedby={invalid ? `regexp-error-${i}` : undefined}
                            value={c.mustMatchRegexp ?? ''}
                            onChange={(e) => setConstraint(i, { mustMatchRegexp: e.target.value || undefined })}
                          />
                          {invalid ? <span id={`regexp-error-${i}`} className="cell-error">Invalid regular expression</span> : null}
                        </td>
                        <td>
                          <button type="button" className="cell-remove" aria-label={`Remove ${who}`} onClick={() => edit({ constraints: draft.constraints.filter((_, j) => j !== i) })}>
                            <Icon name="trash" size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {draft.constraints.length === 0 ? <tr><td colSpan={6} className="constraints-empty">No constraint: every header and query value is accepted.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <div className="constraints-foot">
              <Button size="sm" variant="secondary" icon="plus" onClick={() => edit({ constraints: [...draft.constraints, { in: 'header', name: '', required: false, recopy: false } as unknown as ParameterConstraint] })}>Add constraint</Button>
              <span className="constraints-hint"><code>recopy</code> echoes the value in a response header, e.g. a correlation id.</span>
            </div>
          </Panel>

          <Panel padding="lg" id="sec-stateful" className="stateful" aria-labelledby="stateful-title" data-on={draft.stateful || undefined}>
            <div className="stateful-head">
              <div className="stateful-text">
                <h2 id="stateful-title" className="panel-title">Stateful mock</h2>
                <span id="stateful-desc" className="stateful-desc">Persist state between calls, e.g. count views, keep a cart, reflect a PATCH in later GETs.</span>
              </div>
              <label className="stateful-switch">
                <input type="checkbox" role="switch" className="switch" data-size="lg" aria-labelledby="stateful-title" aria-describedby="stateful-desc" checked={draft.stateful} onChange={(e) => toggleStateful(e.target.checked)} />
                <span aria-hidden="true">{draft.stateful ? 'On' : 'Off'}</span>
              </label>
            </div>
            <ul className="stateful-cards">
              <li><span className="stateful-card-title">Runs in a SCRIPT dispatcher</span><span>Turning it on switches the dispatcher to SCRIPT and loads a sample that reads and writes the <code>store</code>.</span></li>
              <li><span className="stateful-card-title">Scoped to {svc.name} {svc.version}</span><span>The key/value store is shared by its {svc.operationCount} operations, never by other APIs.</span></li>
              <li><span className="stateful-card-title">Values expire</span><span>Default time-to-live is 10 s; set another with <code>store.put(key, value, ttl)</code>.</span></li>
            </ul>
            {switched && draft.stateful ? (
              <p role="status" className="stateful-note"><Icon name="info" size={14} />Dispatcher switched to SCRIPT with a view-counter sample. Responses can read <code>{'{{ views }}'}</code> from the request context.</p>
            ) : null}
          </Panel>
        </SplitPaneMain>

        <SplitPaneSide>
          <SimulatorPanel
            serviceId={serviceId}
            operationId={operationId}
            method={operation.method}
            protocol={svc.protocol}
            mockBase={`http://microcks.local:8080/rest/${svc.name.replace(/ /g, '+')}/${svc.version}`}
            draft={draft}
          />
        </SplitPaneSide>
      </SplitPane>
    </div>
  );
}
