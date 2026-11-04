import { useId, useRef, useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import type { CreateTestForm } from '@/application/testing';
import {
  CI_FORMATS,
  CI_STEPS,
  buildCiSnippet,
  ciDiffLegend,
  diffCiLines,
  parseTimeout,
  summarizeSelection,
  timeoutHelp,
  validateTestForm,
  type CiFormat,
  type CiHeader,
  type TestRunner,
  type TestTarget,
} from '@/domain/testing';
import { PageHeader, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox, Radio } from '@/ui/components/ui/checkbox';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Select } from '@/ui/components/ui/select';
import { Switch } from '@/ui/components/ui/switch';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import './test-create.css';

interface HeaderRow extends CiHeader {
  id: number;
}

interface Draft {
  serviceId: string;
  endpoint: string;
  runner: TestRunner;
  timeout: string;
  secret: string;
  ops: string[] | null;
  oauth: boolean;
  tokenUri: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  headers: HeaderRow[];
  nextId: number;
}

function recommendedRunner(target: TestTarget): TestRunner {
  return (target.runners.find((r) => r.recommended) ?? target.runners[0])?.id ?? 'OPEN_API_SCHEMA';
}

function initialDraft(target: TestTarget): Draft {
  return {
    serviceId: target.serviceId,
    endpoint: target.endpoint,
    runner: recommendedRunner(target),
    timeout: '10000',
    secret: '',
    ops: target.type === 'EVENT' ? [target.operations[0]?.id ?? ''] : null,
    oauth: false,
    tokenUri: 'https://auth.staging.acme.io/realms/bakery/protocol/openid-connect/token',
    clientId: 'pastry-tests',
    clientSecret: '',
    scopes: 'pastry:read pastry:write',
    headers: [],
    nextId: 1,
  };
}

export default function TestCreatePage() {
  usePageTitle('Run a test · Microcks');
  const uc = useUseCases();
  const [params] = useSearchParams();
  const serviceParam = params.get('service') ?? undefined;
  const query = useQuery(() => uc.testing.getCreateForm(serviceParam), [serviceParam]);
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const form = query.data;
  const serviceId = chosen ?? form?.defaults.serviceId;
  const service = form?.services.find((s) => s.id === serviceId);
  const target = form?.targets.find((t) => t.serviceId === serviceId);
  const serviceLabel = service ? `${service.name} ${service.version}`.trim() : 'Service';

  return (
    <>
      <PageHeader
        title="Run a test"
        breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: serviceLabel, to: service ? `/services/${service.id}` : '/services' }, { label: 'New test' }]}
        description="Replay the contract's examples against a deployed implementation and check that it conforms. Every choice below is mirrored, line by line, in the CI snippet on the right."
        descriptionTone="secondary"
        actions={
          target ? (
            <ApiBadge label="last test" value={target.lastTest.text} status={target.lastTest.ok === null ? 'neutral' : target.lastTest.ok ? 'success' : 'danger'} />
          ) : null
        }
      />
      {query.status === 'loading' && !form ? <LoadingBlock label="the test form" /> : null}
      {query.status === 'error' ? <ErrorBlock error={query.error} what="The test form" onRetry={query.reload} /> : null}
      {form && serviceId ? <TestForm key={serviceParam ?? 'default'} form={form} chosen={serviceId} onChoose={setChosen} /> : null}
    </>
  );
}

function TestForm({ form, chosen, onChoose }: { form: CreateTestForm; chosen: string; onChoose: (id: string) => void }) {
  const uc = useUseCases();
  const navigate = useNavigate();
  const uid = useId();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ciTab, setCiTab] = useState<CiFormat>('cli');
  // The client secret message waits for a blur or a launch attempt; until then only the border is red.
  const [secretTouched, setSecretTouched] = useState(false);
  const endpointRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<HTMLInputElement>(null);
  const opsRef = useRef<HTMLInputElement>(null);
  const clientSecretRef = useRef<HTMLInputElement>(null);

  const target = form.targets.find((t) => t.serviceId === chosen) ?? (form.targets[0] as TestTarget);
  const service = form.services.find((s) => s.id === target.serviceId);
  const d = draft && draft.serviceId === target.serviceId ? draft : initialDraft(target);
  const update = (patch: Partial<Draft>) => setDraft({ ...d, ...patch });
  const isEvent = target.type === 'EVENT';

  const selected = d.ops ?? target.operations.map((o) => o.id);
  const allSelected = selected.length === target.operations.length;
  const errors = validateTestForm(target.type, {
    endpoint: d.endpoint,
    timeout: d.timeout,
    selectedOperations: selected,
    oauth: d.oauth,
    clientSecret: d.clientSecret,
  });
  // Same order and wording as the prototype's blocked Launch button.
  const blockReason = errors.endpoint ?? (errors.operations ? 'Select at least one operation.' : undefined) ?? (errors.timeout ? 'Fix the timeout.' : undefined) ?? (errors.clientSecret ? 'OAuth2 client secret is required.' : undefined);
  const waitSec = Math.round((parseTimeout(d.timeout) ?? 10_000) / 1000);

  const ciInput = {
    apiRef: `${service?.name ?? ''}:${service?.version ?? ''}`,
    apiName: service?.name ?? '',
    endpoint: d.endpoint,
    runner: d.runner,
    waitSec,
    secret: d.secret,
    allOperations: allSelected,
    selectedOperations: target.operations.filter((o) => selected.includes(o.id)).map((o) => o.name),
    headers: d.headers.map(({ scope, name, values }) => ({ scope, name, values })),
    isEvent,
  };
  const defaultInput = {
    ...ciInput,
    endpoint: target.endpoint,
    runner: recommendedRunner(target),
    waitSec: 10,
    secret: '',
    allOperations: true,
    headers: [],
  };
  const lines = diffCiLines(buildCiSnippet(ciInput, ciTab), buildCiSnippet(defaultInput, ciTab));
  const changed = lines.filter((l) => l.changed).length;
  const serviceLabel = `${service?.name ?? ''} ${service?.version ?? ''}`.trim();
  const samples = target.operations.reduce((n, o) => n + o.samples, 0);

  const focusFirstError = () => {
    if (errors.endpoint) endpointRef.current?.focus();
    else if (errors.operations) opsRef.current?.focus();
    else if (errors.timeout) timeoutRef.current?.focus();
    else if (errors.clientSecret) clientSecretRef.current?.focus();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (blockReason) {
      setSecretTouched(true);
      focusFirstError();
      return;
    }
    setBusy(true);
    try {
      const run = await uc.testing.create({
        serviceId: target.serviceId,
        endpoint: d.endpoint.trim(),
        runner: d.runner,
        timeoutMs: parseTimeout(d.timeout) ?? 10_000,
        secretName: d.secret || undefined,
        operations: selected,
        headers: d.headers.filter((h) => h.name.trim()).map((h) => ({ name: h.name.trim(), value: h.values })),
      });
      navigate(`/tests/runner/${run.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The test could not be launched.');
      setBusy(false);
    }
  };

  const pickService = (id: string) => {
    onChoose(id);
    setDraft(null);
    setSecretTouched(false);
  };

  const setHeader = (id: number, patch: Partial<HeaderRow>) => update({ headers: d.headers.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const opsError = errors.operations;
  const opsErrorId = `${uid}-ops-error`;
  const blockId = `${uid}-block`;

  return (
    <div className="tc-layout">
      <form className="tc-form" aria-label="Test configuration" onSubmit={onSubmit} noValidate>
        <fieldset className="tc-section">
          <legend>
            <span className="tc-step">01</span>Target
          </legend>
          <Field label="Service under test">
            {(control) => (
              <div className="tc-service-row">
                <span className="tc-svc-picker">
                  {service ? <ApiBadge protocol={service.protocol} name={service.name} version={service.version} /> : null}
                  <span className="tc-svc-meta">
                    {target.operations.length} {target.operations.length === 1 ? 'operation' : 'operations'} · {samples} {samples === 1 ? 'sample' : 'samples'}
                  </span>
                  <Icon name="chevron-down" size={14} />
                  {/* The native select carries the keyboard and screen reader behaviour; the styled box above is its face. */}
                  <select {...control} aria-describedby={`${uid}-contract`} className="tc-svc-select" value={target.serviceId} onChange={(e) => pickService(e.target.value)}>
                    {form.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.version} · {form.targets.find((t) => t.serviceId === s.id)?.operations.length ?? 0} ops
                      </option>
                    ))}
                  </select>
                </span>
                <span className="tc-contract" id={`${uid}-contract`}>
                  Contract: <span className="tc-contract-value">{target.artifacts}</span>
                </span>
              </div>
            )}
          </Field>
          <div className="tc-endpoint-block">
            <Field label="Test endpoint" required help={target.endpointHelp} error={errors.endpoint} className="tc-endpoint">
              {(control) => (
                <Input
                  {...control}
                  ref={endpointRef}
                  mono
                  spellCheck={false}
                  autoComplete="off"
                  value={d.endpoint}
                  onChange={(e) => update({ endpoint: e.target.value })}
                />
              )}
            </Field>
            {target.recentEndpoints.length > 0 ? (
              <div className="tc-recent" role="group" aria-label="Recently tested endpoints">
                <span className="tc-recent-label">Recently tested</span>
                {target.recentEndpoints.map((r) => (
                  <Chip key={r.url} size="sm" pressed={r.url === d.endpoint.trim()} onClick={() => update({ endpoint: r.url })} className="tc-recent-chip">
                    <span className="tc-recent-env">{r.env}</span> {r.url}
                  </Chip>
                ))}
              </div>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="tc-section" data-gap="12">
          <legend>
            <span className="tc-step">02</span>Test runner
            <span className="tc-legend-hint">What &quot;conformant&quot; means for this run</span>
          </legend>
          <div role="radiogroup" aria-label="Test runner" className="tc-runner-grid">
            {target.runners.map((r) => {
              const meta = form.runners.find((m) => m.id === r.id);
              return (
                <Radio
                  key={r.id}
                  variant="card"
                  name="runner"
                  value={r.id}
                  checked={d.runner === r.id}
                  disabled={Boolean(r.unavailableReason)}
                  onChange={() => update({ runner: r.id })}
                  label={
                    <span className="tc-runner-name">
                      <span className="tc-runner-id">{r.id}</span>
                      {r.recommended ? <span className="tc-bestfit">best fit</span> : null}
                    </span>
                  }
                  description={
                    <>
                      <span className="tc-runner-desc">{meta?.description}</span>
                      {r.unavailableReason ? <span className="tc-reason">{r.unavailableReason}</span> : null}
                    </>
                  }
                />
              );
            })}
          </div>
        </fieldset>

        <fieldset className="tc-section">
          <legend>
            <span className="tc-step">03</span>Scope
          </legend>
          <div className="tc-scope">
            <div className="tc-ops" role={isEvent ? 'radiogroup' : 'group'} aria-labelledby={`${uid}-ops-label`} aria-describedby={opsError ? opsErrorId : undefined}>
              <div className="tc-ops-head">
                <span id={`${uid}-ops-label`} className="tc-ops-label">
                  {isEvent ? 'Operation to listen to' : `Operations · ${selected.length} of ${target.operations.length}`}
                </span>
                {!isEvent ? (
                  <Button variant="link" size="sm" className="tc-ops-toggle" onClick={() => update({ ops: allSelected ? [] : target.operations.map((o) => o.id) })}>
                    {allSelected ? 'Clear all' : 'Select all'}
                  </Button>
                ) : null}
              </div>
              {target.operations.map((o, i) => {
                const on = selected.includes(o.id);
                const label = <OperationLabel verb={o.verb} path={o.path} samples={o.samples} protocol={service?.protocol} />;
                return isEvent ? (
                  <Radio key={o.id} ref={i === 0 ? opsRef : undefined} variant="card" className="tc-op" name="operation" checked={on} onChange={() => update({ ops: [o.id] })} label={label} />
                ) : (
                  <Checkbox
                    key={o.id}
                    ref={i === 0 ? opsRef : undefined}
                    variant="card"
                    className="tc-op"
                    checked={on}
                    onChange={(e) => update({ ops: e.target.checked ? [...selected, o.id] : selected.filter((x) => x !== o.id) })}
                    label={label}
                  />
                );
              })}
              {opsError ? (
                <p className="error" id={opsErrorId}>
                  <Icon name="cross" size={13} />
                  <span>
                    <span className="sr-only">Error: </span>
                    {opsError}
                  </span>
                </p>
              ) : null}
            </div>
            <Field label="Timeout" help={timeoutHelp(d.timeout, isEvent)} error={errors.timeout} className="tc-timeout-field">
              {(control) => (
                <div className="tc-timeout">
                  <Input
                    {...control}
                    ref={timeoutRef}
                    type="number"
                    mono
                    min={1000}
                    max={30000}
                    step={1000}
                    value={d.timeout}
                    onChange={(e) => update({ timeout: e.target.value })}
                  />
                  <span className="tc-unit" aria-hidden="true">
                    ms
                  </span>
                </div>
              )}
            </Field>
          </div>
        </fieldset>

        <fieldset className="tc-section">
          <legend>
            <span className="tc-step">04</span>Authentication
            <span className="tc-legend-hint">Optional · to reach a secured endpoint</span>
          </legend>
          <div className="tc-auth">
            <Field label="Secret" help="Credentials or CA certificate managed in Administration › Secrets.">
              {(control) => (
                <Select {...control} className="tc-mono-select" value={d.secret} onChange={(e) => update({ secret: e.target.value })}>
                  <option value="">None</option>
                  {form.secrets.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="tc-oauth-toggle" role="group" aria-labelledby={`${uid}-oauth-label`}>
              <span id={`${uid}-oauth-label`} className="label">
                OAuth2
              </span>
              <Switch label="Client credentials grant" aria-describedby={`${uid}-oauth-help`} checked={d.oauth} onChange={(checked) => update({ oauth: checked })} />
              <p className="help" id={`${uid}-oauth-help`}>
                Microcks fetches a token before each request. <span className="demo-mono">openid</span> is always included in scopes.
              </p>
            </div>
          </div>
          {d.oauth ? (
            <div className="tc-oauth">
              <div className="tc-wide">
                <Field label="Token URI">{(control) => <Input {...control} mono className="tc-link-input" spellCheck={false} value={d.tokenUri} onChange={(e) => update({ tokenUri: e.target.value })} />}</Field>
              </div>
              <Field label="Client Id">{(control) => <Input {...control} mono spellCheck={false} value={d.clientId} onChange={(e) => update({ clientId: e.target.value })} />}</Field>
              <Field label="Client Secret" required error={secretTouched ? errors.clientSecret : undefined}>
                {(control) => (
                  <Input
                    {...control}
                    aria-invalid={errors.clientSecret ? true : undefined}
                    onBlur={() => setSecretTouched(true)}
                    ref={clientSecretRef}
                    type="password"
                    mono
                    placeholder="Required"
                    autoComplete="off"
                    value={d.clientSecret}
                    onChange={(e) => update({ clientSecret: e.target.value })}
                  />
                )}
              </Field>
              <div className="tc-wide">
                <Field
                  label={
                    <>
                      Scopes <span className="tc-label-hint">space-separated</span>
                    </>
                  }
                >
                  {(control) => <Input {...control} mono spellCheck={false} value={d.scopes} onChange={(e) => update({ scopes: e.target.value })} />}
                </Field>
              </div>
            </div>
          ) : null}
        </fieldset>

        {!isEvent ? (
          <fieldset className="tc-section" data-gap="12">
            <legend>
              <span className="tc-step">05</span>Request headers
              <span className="tc-legend-hint">Optional · added to or overriding the examples&apos; headers</span>
            </legend>
            {d.headers.length === 0 ? <p className="tc-empty">No extra header. Use a comma-separated list for several values of the same header.</p> : null}
            {d.headers.length > 0 ? (
              <div className="tc-headers">
                <div className="tc-header-row tc-header-head" aria-hidden="true">
                  <span>Applies to</span>
                  <span>Name</span>
                  <span>Values</span>
                  <span />
                </div>
                {d.headers.map((h, i) => (
                  <div className="tc-header-row" key={h.id}>
                    <Select aria-label={`Header ${i + 1} applies to`} className="tc-mono-select" value={h.scope} onChange={(e) => setHeader(h.id, { scope: e.target.value })}>
                      <option value="globals">All operations</option>
                      {target.operations.map((o) => (
                        <option key={o.id} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                    </Select>
                    <Input aria-label={`Header ${i + 1} name`} mono spellCheck={false} placeholder="x-api-key" value={h.name} onChange={(e) => setHeader(h.id, { name: e.target.value })} />
                    <Input aria-label={`Header ${i + 1} values`} mono spellCheck={false} placeholder="value1, value2" value={h.values} onChange={(e) => setHeader(h.id, { values: e.target.value })} />
                    <Button iconOnly icon="cross" size="sm" aria-label={`Remove header ${h.name || i + 1}`} onClick={() => update({ headers: d.headers.filter((x) => x.id !== h.id) })} />
                  </div>
                ))}
              </div>
            ) : null}
            <div className="tc-header-actions">
              <Button variant="dashed" size="compact" icon="plus" onClick={() => update({ headers: [...d.headers, { id: d.nextId, scope: 'globals', name: '', values: '' }], nextId: d.nextId + 1 })}>
                Add header
              </Button>
              {d.headers.length === 0 ? (
                <Button
                  variant="outline"
                  size="compact"
                  className="tc-apikey"
                  onClick={() => update({ headers: [{ id: d.nextId, scope: 'globals', name: 'x-api-key', values: 'staging-4f2a9c' }], nextId: d.nextId + 1 })}
                >
                  + x-api-key (globals)
                </Button>
              ) : null}
            </div>
          </fieldset>
        ) : null}

        {submitError ? (
          <div className="tc-submit-error">
            <Callout tone="danger" live="assertive" title="The test could not be launched">
              {submitError}
            </Callout>
          </div>
        ) : null}

        <div className="tc-actions">
          <span className="tc-summary">{summarizeSelection(target, selected, d.runner, waitSec)}</span>
          <div className="tc-actions-buttons">
            <Button asChild variant="outline" size="lg">
              <RouterLink to={`/services/${target.serviceId}`}>Cancel</RouterLink>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon="play"
              loading={busy}
              aria-disabled={blockReason ? true : undefined}
              aria-describedby={blockReason ? blockId : undefined}
              title={blockReason}
            >
              Launch test
            </Button>
            {blockReason ? (
              <span id={blockId} className="sr-only">
                {blockReason}
              </span>
            ) : null}
          </div>
        </div>
      </form>

      <aside className="tc-ci" aria-labelledby={`${uid}-ci-title`}>
        <div className="tc-ci-head">
          <h2 id={`${uid}-ci-title`} className="tc-ci-title">
            Run it from CI
          </h2>
          <span className="tc-synced">
            <Icon name="refresh-arrows" size={12} />
            synced with the form
          </span>
        </div>
        <p className="tc-ci-intro">The same test, as code. Once it passes here, paste it in your pipeline so every build proves the contract.</p>
        <CodeBlock
          className="tc-ci-code"
          tabsLabel="CI format"
          tabs={CI_FORMATS.map((f) => ({ id: f.id, label: f.label }))}
          tab={ciTab}
          onTabChange={(id) => setCiTab(id as CiFormat)}
          lines={lines.map((l) => ({ text: l.text || ' ', selected: l.changed }))}
        />
        <p className="tc-ci-legend" role="status">
          <span className="tc-ci-swatch" aria-hidden="true" />
          <span>{ciDiffLegend(changed, serviceLabel)}</span>
        </p>
        {d.oauth ? (
          <div className="tc-callout-outline" role="note">
            <Icon name="warning" size={14} />
            <span>OAuth2 settings only apply to this run from the UI: the CLI, the GitHub Action and the Tekton task shown here do not carry them.</span>
          </div>
        ) : null}
        <div className="tc-ci-steps">
          <h3>Before you paste</h3>
          <ol>
            {CI_STEPS[ciTab].map((step, i) => (
              <li key={step}>
                <span className="tc-ci-step-n" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function OperationLabel({ verb, path, samples, protocol }: { verb: string; path: string; samples: number; protocol?: Parameters<typeof MethodTag>[0]['protocol'] }) {
  return (
    <span className="tc-op-label">
      <MethodTag method={verb} protocol={protocol} />
      <span className="tc-op-path">{path}</span>
      <span className="tc-op-samples">
        {samples} {samples === 1 ? 'sample' : 'samples'}
      </span>
    </span>
  );
}
