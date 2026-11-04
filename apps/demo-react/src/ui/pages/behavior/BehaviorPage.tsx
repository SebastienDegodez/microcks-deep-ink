import '../explore-kit/explore.css';
import './behavior.css';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import {
  isValidRegExp, scriptSample, type Behavior, type ParameterConstraint,
} from '@/domain/catalog';
import { PageHeader, useAnnounce, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import { Segmented } from '@/ui/components/ui/segmented';
import { Select } from '@/ui/components/ui/select';
import { Switch } from '@/ui/components/ui/switch';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';
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

  const dirty = useMemo(() => Boolean(draft && saved.data && JSON.stringify(draft) !== JSON.stringify(saved.data)), [draft, saved.data]);

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
      edit({ stateful: false });
      setSwitched(false);
    }
  };
  const setConstraint = (i: number, patch: Partial<ParameterConstraint>) =>
    edit({ constraints: draft.constraints.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const save = async () => {
    await uc.catalog.saveBehavior(serviceId, operationId, draft);
    saved.reload();
    setSavedAt(true);
    announce('Behavior saved.');
  };

  return (
    <div className="behavior-page">
      <PageHeader
        title={operation.path}
        breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${svc.name} ${svc.version}`, to: `/services/${svc.id}` }, { label: `${operation.method} ${operation.path}` }]}
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

      <div className="behavior-layout">
        <div className="behavior-config">
          <DispatcherPanel draft={draft} examples={exs} pathParams={pathParams} pathPrefix={operation.path.split('{')[0] ?? '/'} edit={edit} />

          <Panel padding="lg" title="Delay" id="sec-delay">
            <p className="panel-lead">Simulates the dependency's response time. Applies to every call unless the caller overrides it.</p>
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

          <Panel padding="lg" title="Parameter constraints" id="sec-constraints" actions={<span className="ex-small ex-secondary">{draft.constraints.length} {draft.constraints.length === 1 ? 'constraint' : 'constraints'}</span>}>
            <p className="panel-lead">Expectations the contract cannot express. A violated constraint returns 400 before dispatching.</p>
            <div className="ex-small" style={{ overflowX: 'auto' }}>
              <table className="table" aria-label="Parameter constraints">
                <thead><tr><th scope="col">In</th><th scope="col">Name</th><th scope="col">Required</th><th scope="col">Recopy</th><th scope="col">Must match regexp</th><th scope="col"><span className="sr-only">Remove</span></th></tr></thead>
                <tbody>
                  {draft.constraints.map((c, i) => {
                    const invalid = Boolean(c.mustMatchRegexp) && !isValidRegExp(c.mustMatchRegexp ?? '');
                    const who = c.name || `constraint ${i + 1}`;
                    return (
                      <tr key={i}>
                        <td><Select aria-label={`Location of ${who}`} value={c.in} onChange={(e) => setConstraint(i, { in: e.target.value as ParameterConstraint['in'] })}><option value="header">header</option><option value="query">query</option></Select></td>
                        <td><Input aria-label={`Name of ${who}`} placeholder="parameter name" value={c.name} onChange={(e) => setConstraint(i, { name: e.target.value })} /></td>
                        <td><Checkbox label={<span className="sr-only">{`${who} is required`}</span>} checked={c.required} onChange={(e) => setConstraint(i, { required: e.target.checked })} /></td>
                        <td><Checkbox label={<span className="sr-only">{`Recopy ${who}`}</span>} checked={Boolean(c.recopy)} onChange={(e) => setConstraint(i, { recopy: e.target.checked })} /></td>
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

          <Panel padding="lg" title="Stateful mock" id="sec-stateful">
            <Switch label="Stateful mock" description="Persist state between calls, e.g. count views, keep a cart, reflect a PATCH in later GETs." checked={draft.stateful} onChange={toggleStateful} />
            <ul className="ex-plain-list ex-small ex-secondary" style={{ marginTop: 8 }}>
              <li><strong>Runs in a SCRIPT dispatcher.</strong> Turning it on switches the dispatcher to SCRIPT and loads a sample that reads and writes the <code>store</code>.</li>
              <li><strong>Scoped to {svc.name} {svc.version}.</strong> The key/value store is shared by its operations, never by other APIs.</li>
              <li><strong>Values expire.</strong> Default time-to-live is 10 s; set another with <code>store.put(key, value, ttl)</code>.</li>
            </ul>
            {switched ? <Callout tone="info" live="polite">Dispatcher switched to SCRIPT with a view-counter sample. Responses can read <code>{'{{ views }}'}</code> from the request context.</Callout> : null}
          </Panel>
        </div>

        <SimulatorPanel
          serviceId={serviceId}
          operationId={operationId}
          method={operation.method}
          protocol={svc.protocol}
          mockBase={`http://microcks.local:8080/rest/${svc.name.replace(/ /g, '+')}/${svc.version}`}
          draft={draft}
        />
      </div>
    </div>
  );
}
