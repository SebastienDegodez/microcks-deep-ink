import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { timeoutOrDefault, validateRunRequest, type FieldError } from '@/domain/arazzo';
import { isRunScenario, type RunSetup, type StartRunInput } from '@/application/arazzo';
import { Link as RouterLink } from 'react-router';
import { PageHeader, useAnnounce, usePageTitle, useQuery, useUseCases } from '@/ui/app';
import { Chip, ApiBadge, Button, Callout, Checkbox, Radio, Facts, Field, Input, RunMeta, Select, Stepper } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { ButtonRouterLink, workflowPath, runPath, runSetupPath } from '../workflows/shared';
import { RunApiPanel, RunBadges, runBreadcrumb } from './run-parts';
import '../workflows/workflows.css';
import './workflow-run.css';

type Target = 'mocks' | 'implementations' | 'mixed';

export default function RunSetupPage() {
  const { docId = '', workflowId = '' } = useParams();
  const [search] = useSearchParams();
  const scenarioParam = search.get('scenario');
  const scenario = isRunScenario(scenarioParam) ? scenarioParam : undefined;
  const exampleParam = search.get('example') ?? undefined;
  const uc = useUseCases();
  usePageTitle('Run a workflow · Microcks');
  const setup = useQuery(() => uc.arazzo.getRunSetup(docId, workflowId, scenario), [docId, workflowId, scenario]);

  if (setup.status === 'error') {
    return (
      <>
        <PageHeader title="Run workflow" />
        <ErrorBlock error={setup.error} onRetry={setup.reload} title="The run form could not be loaded" />
      </>
    );
  }
  if (!setup.data) {
    return (
      <>
        <PageHeader title="Run workflow" />
        <LoadingBlock label="the run form" rows={6} />
      </>
    );
  }
  // The form is keyed so that changing workflow or preset restarts it from the defaults.
  return <RunForm key={`${docId}/${workflowId}/${scenario ?? ''}/${exampleParam ?? ''}`} setup={setup.data} exampleParam={exampleParam} />;
}

function RunForm({ setup, exampleParam }: { setup: RunSetup; exampleParam?: string }) {
  const uc = useUseCases();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { workflow, document, defaults } = setup;
  const sources = [...new Set(workflow.steps.map((s) => s.sourceName))];

  const initialExample = exampleParam && setup.examples.some((e) => e.id === exampleParam) ? exampleParam : defaults.example;
  const [target, setTarget] = useState<Target>(defaults.target);
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>(defaults.baseUrls);
  const [perSource, setPerSource] = useState<Record<string, 'mock' | 'implementation'>>(defaults.perSource);
  const [secret, setSecret] = useState(defaults.secret);
  const [example, setExample] = useState(initialExample);
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const ex = setup.examples.find((e) => e.id === initialExample);
    return ex ? Object.fromEntries(Object.entries(ex.inputs).map(([k, v]) => [k, String(v)])) : defaults.inputs;
  });
  const [validate, setValidate] = useState(defaults.validateSchemas);
  const [timeoutMs, setTimeoutMs] = useState(defaults.timeoutMs);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<Error | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const chosen = setup.examples.find((e) => e.id === example);
  const detached = example === '';
  const usesImplementation = target === 'implementations' || (target === 'mixed' && Object.values(perSource).includes('implementation'));
  const effectivePer = (name: string) => perSource[name] ?? 'mock';

  const errors: FieldError[] = validateRunRequest({
    workflowId: workflow.workflowId,
    notRunnableMessage: workflow.runnability.runnable ? undefined : workflow.runnability.message,
    target,
    sources,
    baseUrls,
    perSource,
    inputs: workflow.inputs.map((i) => ({ name: i.name, type: i.type, value: inputs[i.name] ?? '' })),
    timeoutMs,
  });
  const errorOf = (field: string) => (submitted ? errors.find((e) => e.field === field)?.message : undefined);

  useEffect(() => {
    if (submitted && errors.length > 0) summaryRef.current?.focus();
    // Focus the summary only when the user submits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const pickExample = (id: string) => {
    setExample(id);
    const ex = setup.examples.find((e) => e.id === id);
    if (ex) setInputs(Object.fromEntries(Object.entries(ex.inputs).map(([k, v]) => [k, String(v)])));
  };
  const setInput = (name: string, value: string) => {
    setInputs((v) => ({ ...v, [name]: value }));
    if (example) setExample('');
  };

  const request: StartRunInput = {
    documentId: document.id,
    workflowId: workflow.workflowId,
    target,
    baseUrls: usesImplementation ? baseUrls : {},
    perSource: target === 'mixed' ? perSource : undefined,
    secret: usesImplementation && secret ? secret : undefined,
    example: example || undefined,
    inputs,
    validateSchemas: validate,
    timeoutMs: timeoutOrDefault(timeoutMs),
  };
  const launch = async () => {
    setSubmitted(true);
    setFailure(null);
    if (errors.length > 0) return;
    setBusy(true);
    try {
      const { runId } = await uc.arazzo.startRun(request);
      announce('Run started.');
      navigate(runPath(runId, true));
    } catch (e) {
      setFailure(e instanceof Error ? e : new Error(String(e)));
      setBusy(false);
    }
  };

  const TARGETS: { value: Target; label: string; proposed?: boolean; description: string }[] = [
    { value: 'mocks', label: 'Microcks mocks', description: 'Each step calls the mocks of its linked API, for example /rest/API+Pastry/2.0. Checks that the mock examples form a coherent scenario.' },
    { value: 'implementations', label: 'Implementations', description: 'Each step calls the base URL you set per source description. Checks the real services against the workflow.' },
    { value: 'mixed', label: 'Mixed', proposed: true, description: 'Per source description: its mocks or its implementation URL.' },
  ];
  const targetLabel = TARGETS.find((t) => t.value === target)?.label ?? '';
  const workflowOptions = setup.workflows;
  const documentLabel = `${document.title} ${document.version}`;
  const workflowTo = workflowPath(document.id, workflow.workflowId);
  const unused = document.sources.map((s) => s.name).filter((n) => !sources.includes(n));
  const helpOf = (name: string) => {
    const p = workflow.steps.flatMap((st) => st.parameters.filter((x) => x.value === `$inputs.${name}`).map((x) => ({ st, x })))[0];
    if (p) return <>{p.x.in === 'query' ? 'Query parameter' : p.x.in === 'path' ? 'Path parameter' : 'Header'} <span className="wfr-mono">{p.x.name}</span> of {p.st.stepId}</>;
    const b = workflow.steps.find((st) => st.requestBody?.includes(`{$inputs.${name}}`));
    const key = b?.requestBody?.match(new RegExp(`"([^"]+)"\\s*:\\s*"\\{\\$inputs\\.${name}\\}"`))?.[1];
    return b ? `Body /${key ?? name} of ${b.stepId}` : undefined;
  };
  const launchHint = `${workflow.workflowId} · ${example ? `example ${example}` : 'own inputs'} against ${target === 'mocks' ? 'the mocks' : target === 'implementations' ? 'implementations' : 'mixed targets'}`;
  const apiInputs = Object.fromEntries(workflow.inputs.flatMap((i) => (inputs[i.name] ? [[i.name, i.type === 'number' || i.type === 'integer' ? Number(inputs[i.name]) : inputs[i.name]]] : [])));

  return (
    <>
      <PageHeader
        title="Run workflow"
        breadcrumb={runBreadcrumb(`${document.title} - ${document.version}`, workflowTo, workflowPath(document.id, workflow.workflowId, 'runs'), 'Run workflow')}
        badge={<RunBadges workflowId={workflow.workflowId} documentLabel={documentLabel} to={workflowTo} chip={<ApiBadge label="status" value="not started" icon="circle" />} />}
        align="start"
      >
        <RunMeta
          className="wfr-run-meta"
          items={[
            {
              term: 'Document',
              kind: 'url',
              value: (
                <RouterLink to={workflowPath(document.id, workflow.workflowId, 'source')} className="wfr-meta-file">
                  {document.file}
                </RouterLink>
              ),
            },
            { term: 'Run against', value: targetLabel },
            { term: 'Started', value: 'not yet' },
            { term: 'Elapsed', value: '—' },
            { term: 'Launched by', value: 'MA' },
          ]}
        />
      </PageHeader>
      <div className="wfr-layout">
        <div className="wfr-main">
          <form
            className="wfr-card wfr-setup"
            noValidate
            aria-labelledby="wfr-setup-h"
            onSubmit={(e) => {
              e.preventDefault();
              void launch();
            }}
          >
            <div className="wfr-setup-head">
              <h2 id="wfr-setup-h" className="wfr-setup-title">
                Run workflow
              </h2>
              <span className="wfr-muted">Choose what the steps call, fill the inputs or play an example, then run.</span>
            </div>

            <div className="wfr-setup-group">
              <Field label={<span className="wfr-legend">Workflow</span>} error={errorOf('workflowId')} className="wfr-field wfr-w-420">
                {(c) => (
                  <Select
                    {...c}
                    className="wfr-mono-control"
                    value={workflow.workflowId}
                    onChange={(e) => {
                      const w = workflowOptions.find((x) => x.workflowId === e.target.value);
                      if (w) navigate(runSetupPath(w.documentId, w.workflowId));
                    }}
                  >
                    {workflowOptions.map((w) => (
                      <option key={`${w.documentId}/${w.workflowId}`} value={w.workflowId}>
                        {w.workflowId} · {w.steps.length} steps{w.runnability.runnable ? '' : ' · not runnable'}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {!workflow.runnability.runnable ? (
                <Callout tone="warning" title="This workflow cannot run yet" live="polite">
                  {workflow.runnability.message}.
                </Callout>
              ) : null}
            </div>

            <fieldset className="wfr-setup-group">
              <legend className="wfr-legend">Run against</legend>
              <div className="wfr-target-grid">
                {TARGETS.map((t) => (
                  <Radio
                    key={t.value}
                    variant="card"
                    name="run-target"
                    value={t.value}
                    checked={target === t.value}
                    onChange={() => setTarget(t.value)}
                    label={
                      <>
                        {t.label}
                        {t.proposed ? <Chip size="sm" variant="dashed" tone="warning" className="wfr-proposed">Proposed · beyond POC</Chip> : null}
                      </>
                    }
                    description={t.description}
                  />
                ))}
              </div>
              {target === 'mixed' ? (
                <p className="wfr-muted">
                  Proposal beyond the POC: the POC sends every source to its mocks or every source to its implementation. Mixed lets a workflow spanning several APIs hit one real
                  service while Microcks mocks the others, e.g. <span className="wfr-mono">compare-prices</span> with apiPastry on staging and apiPastryV1 on its mocks.
                </p>
              ) : null}

              {target !== 'mocks' ? (
                <div className="wfr-source-box">
                  {sources.map((name) => (
                    <SourceBlock
                      key={name}
                      name={name}
                      serviceId={(() => {
                        const l = document.sources.find((s) => s.name === name)?.link;
                        return l?.status === 'linked' ? l.serviceId : undefined;
                      })()}
                      mixed={target === 'mixed'}
                      where={effectivePer(name)}
                      onWhere={(v) => setPerSource((p) => ({ ...p, [name]: v }))}
                      url={baseUrls[name] ?? ''}
                      onUrl={(v) => setBaseUrls((b) => ({ ...b, [name]: v }))}
                      showUrl={target === 'implementations' || effectivePer(name) === 'implementation'}
                      error={errorOf(`baseUrl.${name}`)}
                    />
                  ))}
                  {unused.length > 0 ? (
                    <span className="wfr-note">
                      {workflow.workflowId} calls no other source: {unused.join(' and ')} {unused.length > 1 ? 'are' : 'is'} not used.
                    </span>
                  ) : null}
                  {usesImplementation ? (
                    <div className="wfr-source-secret">
                      <Field label="Secret" help="Every call carries the authorization this secret defines, as in contract tests." className="wfr-field wfr-w-320">
                        {(c) => (
                          <Select {...c} className="wfr-mono-control" value={secret} onChange={(e) => setSecret(e.target.value)}>
                            <option value="">No secret</option>
                            {setup.secrets.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </fieldset>

            <fieldset className="wfr-setup-group">
              <legend className="wfr-legend">
                Inputs{' '}
                <span className="wfr-legend-note">
                  From the workflow <span className="wfr-mono">inputs</span> schema
                </span>
              </legend>
              <Field
                label="Example"
                className="wfr-field wfr-w-420"
                help={
                  <>
                    Recorded in <span className="wfr-mono">{document.file.replace(/\.arazzo\.yaml$/, '.arazzo-sources.yaml')}</span>. Picking one fills the inputs; the run is then judged on it.
                  </>
                }
              >
                {(c) => (
                  <Select {...c} value={example} onChange={(e) => pickExample(e.target.value)}>
                    <option value="">None, I enter the inputs</option>
                    {setup.examples.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.id}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {workflow.inputs.length > 0 ? (
                <div className="wfr-inputs">
                  {workflow.inputs.map((input) => (
                    <Field
                      key={input.name}
                      className="wfr-field wfr-input-field"
                      label={
                        <>
                          <span className="wfr-mono wfr-strong">{input.name}</span> <span className="wfr-label-type">{input.name === 'size' ? 'string · S | M | L' : input.type}</span>
                        </>
                      }
                      error={errorOf(`input.${input.name}`)}
                      help={helpOf(input.name)}
                    >
                      {(c) =>
                        input.name === 'size' ? (
                          <Select {...c} className="wfr-mono-control" value={inputs[input.name] ?? 'M'} onChange={(e) => setInput(input.name, e.target.value)}>
                            {['S', 'M', 'L'].map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            {...c}
                            className="wfr-mono-control"
                            inputMode={input.type === 'number' ? 'decimal' : undefined}
                            spellCheck={false}
                            autoComplete="off"
                            value={inputs[input.name] ?? ''}
                            onChange={(e) => setInput(input.name, e.target.value)}
                          />
                        )
                      }
                    </Field>
                  ))}
                </div>
              ) : (
                <p className="wfr-muted">This workflow has no input.</p>
              )}
              {chosen ? (
                <div className="wfr-expected">
                  <h3 className="wfr-card-subtitle">
                    Expected by <span className="wfr-mono">{chosen.id}</span>
                  </h3>
                  <Facts
                    layout="inline"
                    termWidth="70px"
                    gap="6px 14px"
                    className="wfr-expected-facts"
                    items={[
                      ...(Object.keys(chosen.outputs).length > 0
                        ? [{ term: 'Outputs', mono: true, value: Object.entries(chosen.outputs).map(([k, v]) => `${k} = ${String(v)}`).join(' · ') }]
                        : []),
                      { term: 'Steps', mono: true, value: chosen.steps.map((st) => `${st.stepId} ${st.status}`).join(' ') },
                      { term: 'End', value: chosen.stopsAt ? `Stops at ${chosen.stopsAt}` : 'Runs to its end' },
                    ]}
                  />
                </div>
              ) : detached && Object.keys(inputs).length > 0 ? (
                <p className="wfr-note" role="status">
                  This run plays no example, so its expected outputs will not be checked.
                </p>
              ) : null}
            </fieldset>

            <fieldset className="wfr-setup-group">
              <legend className="wfr-legend">Options</legend>
              <div className="wfr-option">
              <Checkbox
                variant="card"
                label="Validate each response against its OpenAPI schema"
                description="Uses the validators of OpenAPI contract tests: a step fails on a non-conformant response, even when its criteria hold. Off by default."
                checked={validate}
                onChange={(e) => setValidate(e.target.checked)}
              />
              </div>
              <Field label="Timeout per step (ms)" error={errorOf('timeoutMs')} help="How long a step waits for its response." className="wfr-field wfr-w-220">
                {(c) => <Input {...c} className="wfr-mono-control" type="number" min={1} step={1} value={timeoutMs} onChange={(e) => setTimeoutMs(e.target.value)} />}
              </Field>
            </fieldset>

            {submitted && errors.length > 0 ? (
              <div className="wfr-setup-errors">
                <div ref={summaryRef} className="wf-error-summary" role="alert" tabIndex={-1}>
                  <h2>{errors.length === 1 ? '1 problem to fix before running' : `${errors.length} problems to fix before running`}</h2>
                  <ul>
                    {errors.map((e) => (
                      <li key={e.field}>{e.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
            {failure ? (
              <div className="wfr-setup-errors">
                <ErrorBlock error={failure} title="The run could not start" />
              </div>
            ) : null}

            <div className="wfr-setup-foot">
              <span className="wfr-setup-hint">{launchHint}</span>
              <div className="wfr-setup-buttons">
                <ButtonRouterLink to={workflowTo}>Cancel</ButtonRouterLink>
                <Button type="submit" variant="primary" icon="play" loading={busy} aria-disabled={!workflow.runnability.runnable || undefined}>
                  Run
                </Button>
              </div>
            </div>
          </form>
        </div>

        <aside aria-label="Run side panels" className="wfr-aside">
          <section aria-labelledby="wfr-plan-h" className="wfr-card wfr-plan">
            <div className="wfr-plan-head">
              <h2 id="wfr-plan-h" className="wfr-card-title">
                What runs
              </h2>
              <RouterLink to={workflowTo} className="wfr-link wfr-small-13">
                View in the loom
              </RouterLink>
            </div>
            <Stepper
              variant="list"
              marker="circle"
              steps={workflow.steps.map((s, i) => {
                const actions = [
                  ...s.onSuccess.map((a) => (a.type === 'end' ? `onSuccess end${a.criteria?.length ? ` when ${a.criteria.map((c) => c.condition).join(' and ')}` : ''}` : '')),
                  ...s.onFailure.map((a) => (a.type === 'retry' ? `onFailure retry · retryAfter ${a.retryAfter} · retryLimit ${a.retryLimit}` : `onFailure end`)),
                ].filter(Boolean);
                return {
                  id: s.stepId,
                  label: (
                    <>
                      <span className="wfr-plan-id">
                        <span className="sr-only">Step {i + 1}: </span>
                        {s.stepId}
                      </span>
                      <span className="wfr-plan-op">
                        {s.operationId} · {s.method} {s.path}
                      </span>
                      {actions.map((a) => (
                        <span key={a} className="wfr-plan-action">
                          {a}
                        </span>
                      ))}
                    </>
                  ),
                };
              })}
            />
            <p className="wfr-note">
              A step passes when its success criteria hold and, with schema validation on, its response conforms to its OpenAPI schema. A failed step applies its first
              onFailure action whose criteria hold; without one, the run ends there and later steps are not run.
            </p>
          </section>
          <RunApiPanel
            hint="Launches the same run as the form above."
            documentApiId={document.apiId}
            documentLabel={documentLabel}
            workflowId={workflow.workflowId}
            mockUrl={workflow.mockUrl}
            mixed={target === 'mixed'}
            body={{
              inputs: apiInputs,
              timeout: request.timeoutMs,
              ...(target !== 'mocks' ? { implementations: target === 'implementations' ? baseUrls : Object.fromEntries(Object.entries(baseUrls).filter(([k]) => effectivePer(k) === 'implementation')) } : {}),
              ...(request.secret ? { secretName: request.secret } : {}),
              validateSchema: validate,
              ...(example ? { example } : {}),
            }}
          />
        </aside>
      </div>
    </>
  );
}

/** One source description of the workflow: its API badge, where its calls go (Mixed) and the base URL of its implementation. */
function SourceBlock({
  name,
  serviceId,
  mixed,
  where,
  onWhere,
  url,
  onUrl,
  showUrl,
  error,
}: {
  name: string;
  serviceId?: string;
  mixed: boolean;
  where: 'mock' | 'implementation';
  onWhere: (v: 'mock' | 'implementation') => void;
  url: string;
  onUrl: (v: string) => void;
  showUrl: boolean;
  error?: string;
}) {
  const uc = useUseCases();
  const service = useQuery(() => (serviceId ? uc.catalog.getService(serviceId) : Promise.resolve(undefined)), [serviceId]);
  const s = service.data;
  return (
    <div className="wfr-source">
      <div className="wfr-source-head">
        <span className="wfr-mono wfr-strong">{name}</span>
        {s ? (
          <RouterLink to={`/services/${s.id}`} className="wfr-badge-link">
            <ApiBadge protocol={s.protocol} name={s.name} version={s.version} />
          </RouterLink>
        ) : (
          <span className="wfr-note">not linked</span>
        )}
      </div>
      {mixed ? (
        <div role="radiogroup" aria-label={`Where ${name} calls go`} className="wfr-mix">
          <Radio variant="compact" name={`mix-${name}`} value="mock" label="Its mocks" checked={where === 'mock'} onChange={() => onWhere('mock')} />
          <Radio variant="compact" name={`mix-${name}`} value="implementation" label="Its implementation" checked={where === 'implementation'} onChange={() => onWhere('implementation')} />
        </div>
      ) : null}
      {showUrl ? (
        <Field
          label={
            <>
              Base URL of the implementation <span className="wfr-label-type">required</span>
            </>
          }
          error={error}
          className="wfr-field wfr-w-520"
          help={`Absolute http(s) URL; the operation paths of ${s ? `${s.name} ${s.version}` : name} are appended.`}
        >
          {(c) => (
            <Input {...c} required className="wfr-mono-control wfr-url-control" type="url" spellCheck={false} autoComplete="off" placeholder="http://localhost:8080" value={url} onChange={(e) => onUrl(e.target.value)} />
          )}
        </Field>
      ) : (
        <span className="wfr-note">
          Mocks of {s ? `${s.name} ${s.version}` : name}
        </span>
      )}
    </div>
  );
}
