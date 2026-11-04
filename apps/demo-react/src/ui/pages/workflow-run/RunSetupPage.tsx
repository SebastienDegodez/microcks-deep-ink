import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { EXAMPLE_BASE_URL, actionLabel, timeoutOrDefault, validateRunRequest, type FieldError } from '@/domain/arazzo';
import { isRunScenario, type RunSetup, type StartRunInput } from '@/application/arazzo';
import { PageHeader, useAnnounce, usePageTitle, useQuery, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox, RadioGroup } from '@/ui/components/ui/checkbox';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { Field } from '@/ui/components/ui/field';
import { Input } from '@/ui/components/ui/input';
import { Panel } from '@/ui/components/ui/panel';
import { Select } from '@/ui/components/ui/select';
import { ButtonRouterLink, ErrorBlock, LoadingBlock, workflowPath, runPath, runSetupPath } from '../workflows/shared';
import '../workflows/workflows.css';

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
        <PageHeader title="Run a workflow" />
        <ErrorBlock error={setup.error} onRetry={setup.reload} title="The run form could not be loaded" />
      </>
    );
  }
  if (!setup.data) {
    return (
      <>
        <PageHeader title="Run a workflow" />
        <LoadingBlock label="Loading the run form" rows={6} />
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
  const apiBody = {
    target: target === 'mocks' ? { kind: 'mocks' } : target === 'implementations' ? { kind: 'implementations', baseUrls } : { kind: 'mixed', perSource },
    ...(example ? { example } : {}),
    inputs: Object.fromEntries(workflow.inputs.flatMap((i) => (inputs[i.name] ? [[i.name, i.type === 'number' || i.type === 'integer' ? Number(inputs[i.name]) : inputs[i.name]]] : []))),
    ...(request.secret ? { secret: request.secret } : {}),
    validateSchemas: validate,
    timeoutMs: request.timeoutMs,
  };
  const endpoint = `/api/arazzo/documents/${document.apiId}/workflows/${workflow.workflowId}/runs`;
  const curl = `curl -X POST 'http://microcks.local:8080${endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(apiBody)}'`;

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

  const targets: { value: Target; label: React.ReactNode; description: string }[] = [
    { value: 'mocks', label: 'Microcks mocks', description: 'Every step calls the mocks of its API. Nothing real is touched.' },
    { value: 'implementations', label: 'Implementations', description: 'Every step calls the real service at the base URL you give for its source.' },
    {
      value: 'mixed',
      label: (
        <>
          Mixed <Chip variant="dashed">Proposed · beyond POC</Chip>
        </>
      ),
      description: 'Pick, for each source, whether it runs on its mocks or on its implementation.',
    },
  ];

  const workflowOptions = setup.workflows;

  return (
    <>
      <PageHeader
        title="Run a workflow"
        badge={<ApiBadge arazzo name={workflow.workflowId} />}
      />
      <div className="wf-grid-2">
        <form
          className="wf-form"
          noValidate
          aria-label="Run a workflow"
          onSubmit={(e) => {
            e.preventDefault();
            void launch();
          }}
        >
          <Field label="Workflow" help={workflow.summary} error={errorOf('workflowId')}>
            {(c) => (
              <Select
                {...c}
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

          <RadioGroup legend="Run against" name="run-target" value={target} onChange={(v) => setTarget(v as Target)} options={targets} />
          {target === 'mixed' ? (
            <p className="wf-small wf-muted" style={{ margin: 0 }}>
              Proposal beyond the POC: the POC sends every source to its mocks or every source to its implementation. Mixed lets a workflow spanning several APIs hit one real
              service while Microcks mocks the others.
            </p>
          ) : null}

          {target !== 'mocks' ? (
            <div className="wf-fields">
              {sources.map((name) => (
                <div key={name} className="wf-source-card">
                  <div className="wf-row">
                    <strong>{name}</strong>
                    <span className="wf-small wf-muted">
                      {(() => { const l = document.sources.find((s) => s.name === name)?.link; return l?.status === 'linked' ? l.serviceId : 'not linked'; })()}
                    </span>
                  </div>
                  {target === 'mixed' ? (
                    <RadioGroup
                      legend={`Where ${name} calls go`}
                      name={`mix-${name}`}
                      value={effectivePer(name)}
                      onChange={(v) => setPerSource((p) => ({ ...p, [name]: v as 'mock' | 'implementation' }))}
                      options={[
                        { value: 'mock', label: 'Its mocks' },
                        { value: 'implementation', label: 'Its implementation' },
                      ]}
                    />
                  ) : null}
                  {target === 'implementations' || effectivePer(name) === 'implementation' ? (
                    <Field label={`Base URL of the ${name} implementation`} required error={errorOf(`baseUrl.${name}`)} help={`Absolute http(s) URL, such as ${EXAMPLE_BASE_URL}`}>
                      {(c) => <Input {...c} type="url" spellCheck={false} autoComplete="off" placeholder="http://localhost:8080" value={baseUrls[name] ?? ''} onChange={(e) => setBaseUrls((b) => ({ ...b, [name]: e.target.value }))} />}
                    </Field>
                  ) : (
                    <span className="wf-small wf-muted">Mocks of {name}</span>
                  )}
                </div>
              ))}
              {usesImplementation ? (
                <Field label="Secret" help="Every call to an implementation carries the authorization this secret defines, as in contract tests.">
                  {(c) => (
                    <Select {...c} value={secret} onChange={(e) => setSecret(e.target.value)}>
                      <option value="">No secret</option>
                      {setup.secrets.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              ) : null}
            </div>
          ) : null}

          <fieldset className="fieldset">
            <legend>Inputs</legend>
            <div className="wf-fields">
              <Field label="Example" help="Recorded in the ArazzoSources overlay. Picking one fills the inputs; the run is then judged on it.">
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
              {workflow.inputs.map((input) => (
                <Field
                  key={input.name}
                  label={
                    <>
                      {input.name} <span className="wf-small wf-muted">· {input.name === 'size' ? 'string · S | M | L' : input.type}</span>
                    </>
                  }
                  error={errorOf(`input.${input.name}`)}
                  help={input.type === 'number' ? 'A JSON number, with a dot: 3.9' : undefined}
                >
                  {(c) =>
                    input.name === 'size' ? (
                      <Select {...c} value={inputs[input.name] ?? 'M'} onChange={(e) => setInput(input.name, e.target.value)}>
                        {['S', 'M', 'L'].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </Select>
                    ) : (
                      <Input {...c} inputMode={input.type === 'number' ? 'decimal' : undefined} spellCheck={false} autoComplete="off" value={inputs[input.name] ?? ''} onChange={(e) => setInput(input.name, e.target.value)} />
                    )
                  }
                </Field>
              ))}
              {workflow.inputs.length === 0 ? <p className="wf-muted">This workflow has no input.</p> : null}
            </div>
            {chosen ? (
              <dl className="wf-kv">
                <dt>Expected by {chosen.id}</dt>
                <dd>{chosen.description}</dd>
                <dt>Steps</dt>
                <dd>{chosen.steps.map((s) => `${s.stepId} ${s.status}`).join(' · ')}</dd>
                <dt>End</dt>
                <dd>{chosen.stopsAt ? `ends at ${chosen.stopsAt}` : 'runs to the last step'}</dd>
              </dl>
            ) : detached && Object.keys(inputs).length > 0 ? (
              <p className="wf-small wf-muted" role="status" style={{ margin: 0 }}>
                This run plays no example, so its expected outputs will not be checked.
              </p>
            ) : null}
          </fieldset>

          <fieldset className="fieldset">
            <legend>Options</legend>
            <div className="wf-fields">
              <Checkbox
                label="Validate each response against its OpenAPI schema"
                description="A step fails on a non-conformant response, even when its success criteria hold."
                checked={validate}
                onChange={(e) => setValidate(e.target.checked)}
              />
              <Field label="Timeout per step (ms)" error={errorOf('timeoutMs')}>
                {(c) => <Input {...c} type="number" min={1} step={1} value={timeoutMs} onChange={(e) => setTimeoutMs(e.target.value)} />}
              </Field>
            </div>
          </fieldset>

          {submitted && errors.length > 0 ? (
            <div ref={summaryRef} className="wf-error-summary" role="alert" tabIndex={-1}>
              <h2>{errors.length === 1 ? '1 problem to fix before running' : `${errors.length} problems to fix before running`}</h2>
              <ul>
                {errors.map((e) => (
                  <li key={e.field}>{e.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {failure ? <ErrorBlock error={failure} title="The run could not start" /> : null}

          <div className="wf-actions">
            <ButtonRouterLink to={workflowPath(document.id, workflow.workflowId)}>Cancel</ButtonRouterLink>
            <Button type="submit" variant="primary" icon="play" loading={busy} aria-disabled={!workflow.runnability.runnable || undefined}>
              Run
            </Button>
          </div>
        </form>

        <aside aria-label="Run side panels" className="wf-section">
          <Panel title="What runs" actions={<ButtonRouterLink to={workflowPath(document.id, workflow.workflowId)} size="sm" variant="ghost">View in the Loom</ButtonRouterLink>}>
            <ol className="wf-list">
              {workflow.steps.map((s, i) => (
                <li key={s.stepId}>
                  <strong>
                    {i + 1}. {s.stepId}
                  </strong>{' '}
                  <span className="wf-small wf-muted">
                    {s.method} {s.path} · {s.operationId}
                  </span>
                  {s.onFailure.length > 0 ? <div className="wf-small">{s.onFailure.map(actionLabel).join(', ')}</div> : null}
                </li>
              ))}
            </ol>
            <p className="wf-small wf-muted">
              A step passes when its success criteria hold and, with schema validation on, its response conforms to its OpenAPI schema. A failed step applies its first
              onFailure action whose criteria hold; without one, the run ends there and later steps are not run.
            </p>
          </Panel>
          <Panel title="Run it from the API">
            <p className="wf-small wf-muted" style={{ margin: 0 }}>
              The same request, as the form builds it.
            </p>
            <CodeBlock language="bash" caption="curl command that launches the run" code={curl} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
