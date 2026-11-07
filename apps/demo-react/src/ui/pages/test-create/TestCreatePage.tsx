import { useId, useRef, useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router';
import type { CreateTestForm } from '@/application/testing';
import { buildCiSnippet, diffCiLines, parseTimeout, summarizeSelection, validateTestForm, type CiFormat, type TestTarget } from '@/domain/testing';
import { PageHeader, useQuery, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge, Button, Callout } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { AuthSection } from './AuthSection';
import { CiAside } from './CiAside';
import { initialDraft, recommendedRunner, type Draft } from './draft';
import { HeadersSection } from './HeadersSection';
import { RunnerSection } from './RunnerSection';
import { ScopeSection } from './ScopeSection';
import { TargetSection } from './TargetSection';
import './test-create.css';

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
  const serviceLabel = `${service?.name ?? ''} ${service?.version ?? ''}`.trim();

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

  const blockId = `${uid}-block`;

  return (
    <div className="tc-layout">
      <form className="tc-form" aria-label="Test configuration" onSubmit={onSubmit} noValidate>
        <TargetSection form={form} target={target} service={service} d={d} update={update} uid={uid} endpointError={errors.endpoint} endpointRef={endpointRef} onPickService={pickService} />
        <RunnerSection form={form} target={target} d={d} update={update} />
        <ScopeSection target={target} protocol={service?.protocol} d={d} update={update} uid={uid} selected={selected} errors={errors} opsRef={opsRef} timeoutRef={timeoutRef} />
        <AuthSection
          secrets={form.secrets}
          d={d}
          update={update}
          uid={uid}
          clientSecretError={errors.clientSecret}
          secretTouched={secretTouched}
          onSecretBlur={() => setSecretTouched(true)}
          clientSecretRef={clientSecretRef}
        />
        {!isEvent ? <HeadersSection target={target} d={d} update={update} /> : null}

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

      <CiAside uid={uid} ciTab={ciTab} onTabChange={setCiTab} lines={lines} serviceLabel={serviceLabel} oauth={d.oauth} />
    </div>
  );
}
