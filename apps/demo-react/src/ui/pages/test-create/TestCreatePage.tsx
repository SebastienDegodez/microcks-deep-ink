/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- scrollable code and log regions must be reachable by keyboard (WCAG 2.1.1) */
import { useEffect, useRef, useState, type FormEvent } from 'react';
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
import { Checkbox, RadioGroup, type RadioOption } from '@/ui/components/ui/checkbox';
import { Chip } from '@/ui/components/ui/chip';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Disclosure } from '@/ui/components/ui/disclosure';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { Panel } from '@/ui/components/ui/panel';
import { Select } from '@/ui/components/ui/select';
import { Switch } from '@/ui/components/ui/switch';
import { TabPanel, Tabs } from '@/ui/components/ui/tabs';
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

  return (
    <>
      <PageHeader
        title="Run a test"
        eyebrow="Tests"
        actions={
          <Button asChild variant="ghost">
            <RouterLink to="/tests">All test runs</RouterLink>
          </Button>
        }
      />
      <p className="demo-muted">
        Replay the contract&apos;s examples against a deployed implementation and check that it conforms. Every choice below is mirrored, line by line, in
        the CI snippet next to the form.
      </p>
      {query.status === 'loading' && !query.data ? <LoadingBlock label="the test form" /> : null}
      {query.status === 'error' ? <ErrorBlock error={query.error} what="The test form" onRetry={query.reload} /> : null}
      {query.data ? <TestForm key={serviceParam ?? 'default'} form={query.data} initialServiceId={query.data.defaults.serviceId} /> : null}
    </>
  );
}

function TestForm({ form, initialServiceId }: { form: CreateTestForm; initialServiceId: string }) {
  const uc = useUseCases();
  const navigate = useNavigate();
  const [chosen, setChosen] = useState(initialServiceId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ciTab, setCiTab] = useState<CiFormat>('cli');
  const summaryRef = useRef<HTMLDivElement>(null);
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
  const submitted = attempts > 0;
  const show = (key: keyof typeof errors) => (submitted || touched[key] ? errors[key] : undefined);
  const waitSec = Math.round((parseTimeout(d.timeout) ?? 10_000) / 1000);

  useEffect(() => {
    if (attempts > 0) summaryRef.current?.focus();
  }, [attempts]);

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
  const ciText = lines.map((l) => l.text).join('\n');
  const ciFormat = CI_FORMATS.find((f) => f.id === ciTab) ?? (CI_FORMATS[0] as (typeof CI_FORMATS)[number]);
  const serviceLabel = `${service?.name ?? ''} ${service?.version ?? ''}`.trim();

  const runnerOptions: RadioOption[] = target.runners.map((r) => {
    const meta = form.runners.find((m) => m.id === r.id);
    return {
      value: r.id,
      disabled: Boolean(r.unavailableReason),
      label: (
        <span className="tc-runner-name">
          {r.id}
          {r.recommended ? <Chip tone="success" variant="outline">Best fit</Chip> : null}
        </span>
      ),
      description: (
        <>
          {meta?.description}
          {r.unavailableReason ? <span className="tc-reason">{r.unavailableReason}</span> : null}
        </>
      ),
    };
  });

  const focusError = (key: keyof typeof errors) => {
    const refs = { endpoint: endpointRef, timeout: timeoutRef, operations: opsRef, clientSecret: clientSecretRef };
    refs[key].current?.focus();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempts((n) => n + 1);
    setSubmitError('');
    if (Object.keys(errors).length > 0) return;
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

  const errorEntries = (Object.entries(errors) as [keyof typeof errors, string][]).filter(([, message]) => Boolean(message));
  const fieldNames: Record<keyof typeof errors, string> = {
    endpoint: 'Test endpoint',
    operations: 'Operations',
    timeout: 'Timeout',
    clientSecret: 'OAuth2 client secret',
  };

  const pickService = (id: string) => {
    setChosen(id);
    setDraft(null);
    setTouched({});
    setAttempts(0);
  };

  return (
    <div className="demo-two-col" data-wide-aside="">
      <form className="tc-form" aria-label="Test configuration" onSubmit={onSubmit} noValidate>
        {submitted && errorEntries.length > 0 ? (
          <div ref={summaryRef} role="alert" tabIndex={-1} className="demo-error-summary" style={{ margin: 16 }}>
            <h2>
              {errorEntries.length} {errorEntries.length === 1 ? 'problem prevents' : 'problems prevent'} the launch
            </h2>
            <ul>
              {errorEntries.map(([key, message]) => (
                <li key={key}>
                  <button type="button" className="demo-linkbutton" onClick={() => focusError(key)}>
                    {fieldNames[key]}
                  </button>
                  : {message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <fieldset className="tc-section">
          <legend>
            <span className="tc-step">01</span>Target
          </legend>
          <Field label="Service under test" help={`Contract: ${target.artifacts}`}>
            {(control) => (
              <div className="tc-service-row">
                <Select {...control} value={target.serviceId} onChange={(e) => pickService(e.target.value)}>
                  {form.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.version}
                    </option>
                  ))}
                </Select>
                {service ? <ApiBadge protocol={service.protocol} name={service.name} version={service.version} /> : null}
                <span className="demo-muted">
                  {target.operations.length} {target.operations.length === 1 ? 'operation' : 'operations'} ·{' '}
                  {target.operations.reduce((n, o) => n + o.samples, 0)} samples
                </span>
              </div>
            )}
          </Field>
          <Field label="Test endpoint" required help={target.endpointHelp} error={show('endpoint')}>
            {(control) => (
              <Input
                {...control}
                ref={endpointRef}
                mono
                spellCheck={false}
                autoComplete="off"
                value={d.endpoint}
                onChange={(e) => update({ endpoint: e.target.value })}
                onBlur={() => setTouched({ ...touched, endpoint: true })}
              />
            )}
          </Field>
          {target.recentEndpoints.length > 0 ? (
            <div className="tc-recent" role="group" aria-label="Recently tested endpoints">
              <span className="tc-recent-label">Recently tested</span>
              {target.recentEndpoints.map((r) => (
                <Chip key={r.url} pressed={r.url === d.endpoint.trim()} onClick={() => update({ endpoint: r.url })}>
                  <span className="demo-muted">{r.env}</span> {r.url}
                </Chip>
              ))}
            </div>
          ) : null}
        </fieldset>

        <fieldset className="tc-section">
          <legend>
            <span className="tc-step">02</span>Test runner
            <span className="tc-legend-hint">What &quot;conformant&quot; means for this run</span>
          </legend>
          <RadioGroup legend="Test runner" options={runnerOptions} value={d.runner} onChange={(v) => update({ runner: v as TestRunner })} name="runner" />
        </fieldset>

        <fieldset className="tc-section">
          <legend>
            <span className="tc-step">03</span>Scope
          </legend>
          <div className="tc-scope">
            <div className="stack">
              {isEvent ? (
                <RadioGroup
                  legend="Operation to listen to"
                  name="operation"
                  value={selected[0]}
                  onChange={(v) => update({ ops: [v] })}
                  error={show('operations')}
                  options={target.operations.map((o) => ({
                    value: o.id,
                    label: <OperationLabel verb={o.verb} path={o.path} samples={o.samples} />,
                  }))}
                />
              ) : (
                <fieldset className="fieldset" aria-describedby={show('operations') ? 'tc-ops-error' : undefined}>
                  <legend>Operations · {selected.length} of {target.operations.length}</legend>
                  <div className="tc-ops-head">
                    <button
                      type="button"
                      className="demo-linkbutton"
                      onClick={() => update({ ops: allSelected ? [] : target.operations.map((o) => o.id) })}
                    >
                      {allSelected ? 'Clear all' : 'Select all'}
                    </button>
                  </div>
                  {target.operations.map((o, i) => (
                    <Checkbox
                      key={o.id}
                      ref={i === 0 ? opsRef : undefined}
                      checked={selected.includes(o.id)}
                      onChange={(e) => update({ ops: e.target.checked ? [...selected, o.id] : selected.filter((x) => x !== o.id) })}
                      label={<OperationLabel verb={o.verb} path={o.path} samples={o.samples} />}
                    />
                  ))}
                  {show('operations') ? (
                    <p className="error" id="tc-ops-error">
                      <Icon name="warning" size={16} />
                      <span>
                        <span className="sr-only">Error: </span>
                        {show('operations')}
                      </span>
                    </p>
                  ) : null}
                </fieldset>
              )}
            </div>
            <Field label="Timeout" help={timeoutHelp(d.timeout, isEvent)} error={show('timeout')}>
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
                    onBlur={() => setTouched({ ...touched, timeout: true })}
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
          <Field label="Secret" help="Credentials or CA certificate managed in Administration › Secrets.">
            {(control) => (
              <Select {...control} value={d.secret} onChange={(e) => update({ secret: e.target.value })}>
                <option value="">None</option>
                {form.secrets.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Disclosure summary="OAuth2 client credentials" defaultOpen={d.oauth}>
            <Switch
              label="Client credentials grant"
              description="Microcks fetches a token before each request. openid is always included in scopes."
              checked={d.oauth}
              onChange={(checked) => update({ oauth: checked })}
            />
            {d.oauth ? (
              <div className="tc-oauth">
                <div className="tc-wide">
                  <Field label="Token URI">{(control) => <Input {...control} mono spellCheck={false} value={d.tokenUri} onChange={(e) => update({ tokenUri: e.target.value })} />}</Field>
                </div>
                <Field label="Client Id">{(control) => <Input {...control} mono spellCheck={false} value={d.clientId} onChange={(e) => update({ clientId: e.target.value })} />}</Field>
                <Field label="Client Secret" required error={show('clientSecret')}>
                  {(control) => (
                    <Input
                      {...control}
                      ref={clientSecretRef}
                      type="password"
                      autoComplete="off"
                      value={d.clientSecret}
                      onChange={(e) => update({ clientSecret: e.target.value })}
                      onBlur={() => setTouched({ ...touched, clientSecret: true })}
                    />
                  )}
                </Field>
                <div className="tc-wide">
                  <Field label="Scopes" help="Space-separated.">
                    {(control) => <Input {...control} mono spellCheck={false} value={d.scopes} onChange={(e) => update({ scopes: e.target.value })} />}
                  </Field>
                </div>
              </div>
            ) : null}
          </Disclosure>
        </fieldset>

        {!isEvent ? (
          <fieldset className="tc-section">
            <legend>
              <span className="tc-step">05</span>Request headers
              <span className="tc-legend-hint">Optional · added to or overriding the examples&apos; headers</span>
            </legend>
            {d.headers.length === 0 ? <p className="demo-muted">No extra header. Use a comma-separated list for several values of the same header.</p> : null}
            {d.headers.map((h, i) => (
              <div className="tc-header-row" key={h.id}>
                <Field label={`Header ${i + 1} applies to`}>
                  {(control) => (
                    <Select {...control} value={h.scope} onChange={(e) => update({ headers: d.headers.map((x) => (x.id === h.id ? { ...x, scope: e.target.value } : x)) })}>
                      <option value="globals">All operations</option>
                      {target.operations.map((o) => (
                        <option key={o.id} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field label={`Header ${i + 1} name`}>
                  {(control) => (
                    <Input {...control} mono spellCheck={false} placeholder="x-api-key" value={h.name} onChange={(e) => update({ headers: d.headers.map((x) => (x.id === h.id ? { ...x, name: e.target.value } : x)) })} />
                  )}
                </Field>
                <Field label={`Header ${i + 1} values`}>
                  {(control) => (
                    <Input {...control} mono spellCheck={false} placeholder="value1, value2" value={h.values} onChange={(e) => update({ headers: d.headers.map((x) => (x.id === h.id ? { ...x, values: e.target.value } : x)) })} />
                  )}
                </Field>
                <Button iconOnly icon="trash" variant="ghost" aria-label={`Remove header ${h.name || i + 1}`} onClick={() => update({ headers: d.headers.filter((x) => x.id !== h.id) })} />
              </div>
            ))}
            <div className="demo-actions-row">
              <Button icon="plus" onClick={() => update({ headers: [...d.headers, { id: d.nextId, scope: 'globals', name: '', values: '' }], nextId: d.nextId + 1 })}>
                Add header
              </Button>
              {d.headers.length === 0 ? (
                <Button
                  variant="ghost"
                  onClick={() => update({ headers: [{ id: d.nextId, scope: 'globals', name: 'x-api-key', values: 'staging-4f2a9c' }], nextId: d.nextId + 1 })}
                >
                  Add x-api-key example
                </Button>
              ) : null}
            </div>
          </fieldset>
        ) : null}

        {submitError ? (
          <div style={{ margin: 16 }}>
            <Callout tone="danger" live="assertive" title="The test could not be launched">
              {submitError}
            </Callout>
          </div>
        ) : null}

        <div className="tc-actions">
          <span>{summarizeSelection(target, selected, d.runner, waitSec)}</span>
          <div className="demo-actions-row">
            <Button asChild>
              <RouterLink to={`/services/${target.serviceId}`}>Cancel</RouterLink>
            </Button>
            <Button type="submit" variant="primary" icon="play" loading={busy}>
              Launch test
            </Button>
          </div>
        </div>
      </form>

      <Panel as="aside" title="Run it from CI" className="tc-ci" aria-label={undefined}>
        <div className="stack">
          <p className="demo-muted">The same test, as code. Once it passes here, paste it in your pipeline so every build proves the contract.</p>
          <Tabs label="CI format" items={CI_FORMATS.map((f) => ({ id: f.id, label: f.label }))} value={ciTab} onChange={(id) => setCiTab(id as CiFormat)} idPrefix="ci">
            <TabPanel id={ciTab} value={ciTab} idPrefix="ci">
              <figure className="stack" style={{ margin: 0 }}>
                <figcaption className="demo-actions-row" style={{ justifyContent: 'space-between' }}>
                  <span className="demo-muted">{ciFormat.ariaLabel}</span>
                  <CopyButton value={ciText} label="Copy" />
                </figcaption>
                <pre className="tc-ci-code" tabIndex={0} role="region" aria-label={ciFormat.ariaLabel}>
                  <code>
                    {lines.map((l, i) => (
                      <span key={i} className="tc-ci-line" data-changed={l.changed ? '' : undefined}>
                        <span className="tc-ci-mark" aria-hidden="true">
                          {l.changed ? '+' : ' '}
                        </span>
                        {l.changed ? <span className="sr-only">Changed: </span> : null}
                        {l.text || ' '}
                      </span>
                    ))}
                  </code>
                </pre>
              </figure>
            </TabPanel>
          </Tabs>
          <p className="tc-ci-legend" role="status">
            {ciDiffLegend(changed, serviceLabel)}
          </p>
          <ol className="tc-ci-steps">
            {CI_STEPS[ciTab].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </Panel>
    </div>
  );
}

function OperationLabel({ verb, path, samples }: { verb: string; path: string; samples: number }) {
  return (
    <span className="tc-op-label">
      <span className="demo-mono">{verb}</span>
      <span className="demo-mono">{path}</span>
      <span className="demo-muted">
        {samples} {samples === 1 ? 'sample' : 'samples'}
      </span>
    </span>
  );
}
