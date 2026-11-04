import './import.css';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  RECOGNIZED_FORMATS, validateArtifactUrl, validateDirectApi, validateGitForm,
  type DirectApiInput, type ImportPreview, type ImportResult, type ImportSource, type RecentImport,
} from '@/domain/importing';
import { ValidationError } from '@/application/shared';
import { PageHeader, useAnnounce, useQuery, useRelativeTime, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { Chip } from '@/ui/components/ui/chip';
import { DropZone } from '@/ui/components/ui/drop-zone';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input, Textarea } from '@/ui/components/ui/input';
import { Select } from '@/ui/components/ui/select';
import { TabPanel, Tabs } from '@/ui/components/ui/tabs';
import { ImportDone } from './ImportDone';
import { ImportPreviewCard } from './ImportPreview';

type Step = 'idle' | 'analyzing' | 'detected' | 'importing' | 'done';
type SourceTab = 'file' | 'url' | 'git' | 'direct';

/** The placeholders double as defaults: an empty field takes the value it shows, as on the prototype. */
const SAMPLE_URL = 'https://raw.githubusercontent.com/microcks/microcks/master/samples/APIPastry-openapi.yaml';
const GIT_DEFAULTS = { name: 'API Pastry — main', url: 'https://raw.githubusercontent.com/acme/contracts/main/pastry/openapi.yaml' };
const DIRECT_DEFAULTS = { name: 'Order API', version: '1.0', resource: 'order', payload: '{ "id": "ord-1042", "customer": "Laurent", "status": "CREATED" }' };
const EMPTY_DIRECT = { type: 'REST' as DirectApiInput['type'], name: '', version: '', resource: '', payload: '' };
const or = (value: string, fallback: string) => value.trim() || fallback;

const SAMPLES = [
  { label: 'Sample: API Pastry', file: { name: 'apipastry-openapi.yaml', sizeBytes: 5120 } },
  { label: 'Example: Pastry workflows (Arazzo)', file: { name: 'pastry-workflows.arazzo.yaml', sizeBytes: 9216 } },
  { label: 'Example: Pastry concierge (A2A Agent Card)', file: { name: 'agent-card.json', sizeBytes: 3277 } },
];

export default function ImportPage() {
  usePageTitle('Add a source · Microcks');
  const uc = useUseCases();
  const announce = useAnnounce();
  const [step, setStep] = useState<Step>('idle');
  const [tab, setTab] = useState<SourceTab>('file');
  const [preview, setPreview] = useState<ImportPreview | undefined>();
  const [result, setResult] = useState<ImportResult | undefined>();
  const [role, setRole] = useState<'primary' | 'secondary'>('primary');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [url, setUrl] = useState('');
  const [git, setGit] = useState({ name: '', url: '', secret: '', insecure: false });
  const [direct, setDirect] = useState(EMPTY_DIRECT);
  const [touched, setTouched] = useState(false);
  const recent = useQuery(() => uc.importing.recentImports(3), [uc, result]);
  const secrets = useQuery(() => uc.importing.listSecrets(), [uc]);

  const resolvedUrl = or(url, SAMPLE_URL);
  const resolvedGit = { name: or(git.name, GIT_DEFAULTS.name), url: or(git.url, GIT_DEFAULTS.url) };
  const resolvedDirect: DirectApiInput = {
    type: direct.type,
    name: or(direct.name, DIRECT_DEFAULTS.name),
    version: or(direct.version, DIRECT_DEFAULTS.version),
    resource: or(direct.resource, DIRECT_DEFAULTS.resource),
    payload: direct.type === 'GENERIC_EVENT' ? or(direct.payload, DIRECT_DEFAULTS.payload) : direct.payload.trim() || undefined,
  };
  const urlError = touched && tab === 'url' ? validateArtifactUrl(resolvedUrl) : undefined;
  const gitErrors = touched && tab === 'git' ? validateGitForm(resolvedGit) : {};
  const directErrors = touched && tab === 'direct' ? validateDirectApi(resolvedDirect) : {};
  const secretNames = secrets.data ?? [];

  const analyze = async (src: ImportSource) => {
    setError(undefined);
    setStep('analyzing');
    announce('Analyzing the artifact…');
    try {
      const p = await uc.importing.analyze(src);
      setPreview(p);
      setStep('detected');
      announce('Preview ready. Nothing has been created yet.');
    } catch (e) {
      setStep('idle');
      setError(e instanceof ValidationError ? e.message : 'The artifact could not be analyzed.');
    }
  };
  const doImport = async () => {
    if (!preview) return;
    setStep('importing');
    announce('Importing…');
    try {
      const secretId = secretNames.find((s) => s.name === secret)?.id;
      const r = await uc.importing.import(preview.previewId, { role, secretId });
      setResult(r);
      setStep('done');
      announce('Source created. The mock is live.');
    } catch {
      setStep('detected');
      setError('The import failed. Try again.');
    }
  };
  const createDirect = async () => {
    setTouched(true);
    if (Object.keys(validateDirectApi(resolvedDirect)).length) return;
    setStep('importing');
    try {
      const r = await uc.importing.createDirectApi(resolvedDirect);
      setResult(r);
      setPreview(undefined);
      setStep('done');
      announce('Mock created and live.');
    } catch (e) {
      setStep('idle');
      setError(e instanceof Error ? e.message : 'The mock could not be created.');
    }
  };
  const reset = () => {
    setStep('idle');
    setPreview(undefined);
    setResult(undefined);
    setRole('primary');
    setSecret('');
    setError(undefined);
    setTouched(false);
    setDirect(EMPTY_DIRECT);
  };
  const stepIndex = step === 'idle' || step === 'analyzing' ? 0 : step === 'detected' || (step === 'importing' && preview) ? 1 : 2;
  const directDone = step === 'done' && result?.outcome === 'direct';
  const steps = ['Source', directDone ? 'Preview (no contract)' : 'Preview', 'Live mock'];

  return (
    <div className="import" data-main-pad="roomy">
      <PageHeader
        title="Add a source"
        variant="plain"
        descriptionTone="secondary"
        breadcrumb={[{ label: 'Sources', to: '/sources' }, { label: 'Add a source' }]}
        description="Upload a file once, or point Microcks to a URL or a Git repository it keeps in sync. You see what it understood before anything is created."
        actions={
          <ol className="import-stepper" aria-label="Progress">
            {steps.map((label, i) => {
              const done = i < stepIndex || (step === 'done' && i === 2);
              const state = done ? 'done' : i === stepIndex ? 'current' : 'upcoming';
              return (
                <li key={label} data-state={state} aria-current={i === stepIndex ? 'step' : undefined}>
                  <span className="import-stepper-dot" aria-hidden="true">{i + 1}</span>
                  {label}
                  {done ? <span className="sr-only"> (done)</span> : null}
                </li>
              );
            })}
          </ol>
        }
      />
      {error ? <Callout tone="danger" live="assertive" title="Something went wrong">{error}</Callout> : null}

      <div className="import-layout">
        <section aria-label="Add a source" className="import-workspace" aria-busy={step === 'analyzing' || step === 'importing'}>
          {step === 'idle' || step === 'analyzing' ? (
            <div className="source-box">
              <Tabs
                label="Source type"
                idPrefix="imp"
                value={tab}
                onChange={(id) => { setTab(id as SourceTab); setTouched(false); setError(undefined); }}
                items={[
                  { id: 'file', label: 'Upload a file', icon: 'document', hint: 'one-off' },
                  { id: 'url', label: 'URL', icon: 'link' },
                  { id: 'git', label: 'Git repository', icon: 'git-branch', hint: 'scheduled' },
                  { id: 'direct', label: 'Direct API', icon: 'zap' },
                ]}
              >
                <TabPanel id="file" idPrefix="imp" value={tab} className="source-panel">
                  <DropZone
                    heading="Drop a contract here"
                    hint="One or more files, anywhere on the page. Formats .yaml, .json, .xml, .wsdl, .proto, .graphql, .har"
                    chooseLabel="Browse"
                    multiple
                    accept=".yaml,.yml,.json,.xml,.wsdl,.proto,.graphql,.har"
                    onFiles={(files) => void analyze({ kind: 'file', files: files.map((f) => ({ name: f.name, sizeBytes: f.size })) })}
                  />
                  <div className="source-samples">
                    <span>No contract at hand?</span>
                    {SAMPLES.map((s) => (
                      <Button key={s.label} variant="link" icon="arrow-right" onClick={() => void analyze({ kind: 'file', sample: true, files: [s.file] })}>{s.label}</Button>
                    ))}
                  </div>
                  <p className="source-help">One-off upload: relative references are only resolved if a default artifact repository is configured. To follow a contract as it evolves, prefer a Git repository.</p>
                </TabPanel>
                <TabPanel id="url" idPrefix="imp" value={tab} className="source-panel">
                  <form className="source-form" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!validateArtifactUrl(resolvedUrl)) void analyze({ kind: 'url', url: resolvedUrl }); }} noValidate>
                    <Field label="Artifact URL" help="Microcks downloads the file now, then fetches it again on the global schedule to keep the mock in sync. An authentication Secret can be chosen in the next step." error={urlError}>
                      {(c) => <Input {...c} mono type="url" placeholder={SAMPLE_URL} value={url} onChange={(e) => setUrl(e.target.value)} />}
                    </Field>
                    <div className="source-actions"><Button type="submit" variant="primary" loading={step === 'analyzing'}>Analyze URL</Button></div>
                  </form>
                </TabPanel>
                <TabPanel id="git" idPrefix="imp" value={tab} className="source-panel">
                  <form className="source-form" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!Object.keys(validateGitForm(resolvedGit)).length) void analyze({ kind: 'git', repository: resolvedGit.url, name: resolvedGit.name, secretName: git.secret || undefined, insecure: git.insecure }); }} noValidate>
                    <div className="source-row">
                      <Field label="Source name" error={gitErrors.name}>{(c) => <Input {...c} placeholder={GIT_DEFAULTS.name} value={git.name} onChange={(e) => setGit({ ...git, name: e.target.value })} />}</Field>
                      <div data-grow="2"><Field label="File URL in the repository" error={gitErrors.url}>{(c) => <Input {...c} mono type="url" placeholder={GIT_DEFAULTS.url} value={git.url} onChange={(e) => setGit({ ...git, url: e.target.value })} />}</Field></div>
                    </div>
                    <div className="source-row">
                      <Field label="Authentication Secret">
                        {(c) => (
                          <Select {...c} value={git.secret} onChange={(e) => setGit({ ...git, secret: e.target.value })}>
                            <option value="">None (public repository)</option>
                            {secretNames.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </Select>
                        )}
                      </Field>
                      <Checkbox label="Disable SSL validation" checked={git.insecure} onChange={(e) => setGit({ ...git, insecure: e.target.checked })} />
                    </div>
                    <div className="note-box">
                      <Icon name="clock" size={16} />
                      <span>Scheduled source: Microcks re-scans the file on the global <span className="mono">services.update.interval</span> (every hour by default) and resolves external references. <RouterLink to="/sources">Manage sources</RouterLink></span>
                    </div>
                    <div className="source-actions"><Button type="submit" variant="primary" loading={step === 'analyzing'}>Analyze repository</Button></div>
                  </form>
                </TabPanel>
                <TabPanel id="direct" idPrefix="imp" value={tab} className="source-panel">
                  <form className="source-form" onSubmit={(e) => { e.preventDefault(); void createDirect(); }} noValidate>
                    <p className="source-lead">No contract yet? Describe a resource: Microcks generates the artifact and serves a mock that accepts any JSON.</p>
                    <div role="group" aria-label="Direct API type" className="type-cards">
                      <button type="button" className="type-card" aria-pressed={direct.type === 'REST'} onClick={() => setDirect({ ...direct, type: 'REST' })}>
                        <span className="type-card-tag" data-protocol="direct">REST</span>
                        <span className="type-card-title">Generic REST API</span>
                        <span className="type-card-sub">CRUD on a resource, dynamic storage</span>
                      </button>
                      <button type="button" className="type-card" aria-pressed={direct.type === 'GENERIC_EVENT'} onClick={() => setDirect({ ...direct, type: 'GENERIC_EVENT' })}>
                        <span className="type-card-tag" data-protocol="event">EVENT</span>
                        <span className="type-card-title">Generic event-driven API</span>
                        <span className="type-card-sub">Publishes a reference payload on a topic</span>
                      </button>
                    </div>
                    <div className="source-row">
                      <div data-grow="2"><Field label="API name" error={directErrors.name}>{(c) => <Input {...c} placeholder={DIRECT_DEFAULTS.name} value={direct.name} onChange={(e) => setDirect({ ...direct, name: e.target.value })} />}</Field></div>
                      <div data-basis="version"><Field label="Version" error={directErrors.version}>{(c) => <Input {...c} mono placeholder={DIRECT_DEFAULTS.version} value={direct.version} onChange={(e) => setDirect({ ...direct, version: e.target.value })} />}</Field></div>
                      <div data-basis="resource"><Field label="Resource" error={directErrors.resource}>{(c) => <Input {...c} mono placeholder={DIRECT_DEFAULTS.resource} value={direct.resource} onChange={(e) => setDirect({ ...direct, resource: e.target.value })} />}</Field></div>
                    </div>
                    <Field label={<>Reference JSON payload <span className="field-hint">{direct.type === 'GENERIC_EVENT' ? '(required, published as is)' : '(optional, used as a template)'}</span></>} error={directErrors.payload}>
                      {(c) => <Textarea {...c} mono rows={4} spellCheck={false} placeholder={DIRECT_DEFAULTS.payload} value={direct.payload} onChange={(e) => setDirect({ ...direct, payload: e.target.value })} />}
                    </Field>
                    <div className="source-actions"><Button type="submit" variant="primary">Create mock</Button></div>
                  </form>
                </TabPanel>
              </Tabs>
              {tab !== 'direct' ? (
                <div className="formats">
                  <span className="formats-label">Recognized formats</span>
                  {RECOGNIZED_FORMATS.map((f) => <Chip key={f}>{f}</Chip>)}
                </div>
              ) : null}
            </div>
          ) : null}

          {(step === 'detected' || (step === 'importing' && preview)) && preview ? (
            <ImportPreviewCard
              preview={preview}
              role={role}
              onRoleChange={setRole}
              secret={secret}
              onSecretChange={setSecret}
              secretNames={secretNames.map((s) => ({ id: s.id, name: s.name }))}
              importing={step === 'importing'}
              onImport={() => void doImport()}
              onCancel={reset}
            />
          ) : null}

          {step === 'importing' && !preview ? <p role="status">Creating the mock…</p> : null}

          {step === 'done' && result ? <ImportDone result={result} onReset={reset} nextScanMinutes={uc.importing.getScanSchedule().minutesUntilNext} /> : null}
        </section>

        <RecentSources items={recent.data ?? []} />
      </div>
    </div>
  );
}

function RecentSources({ items }: { items: RecentImport[] }) {
  const relative = useRelativeTime();
  return (
    <aside aria-labelledby="recent-title" className="recent">
      <div className="recent-head">
        <h2 id="recent-title">Recent sources</h2>
        <RouterLink to="/services">Full catalog</RouterLink>
      </div>
      <ul className="recent-list">
        {items.map((r) => (
          <li key={r.id}>
            <div className="recent-line">
              {r.protocol === 'ARAZZO' ? <ApiBadge arazzo name={r.name} size="sm" /> : <ApiBadge protocol={r.protocol} name={r.name} size="sm" />}
              <span className="recent-when">{relative(r.at)}</span>
            </div>
            <div className="recent-line">
              <span className="recent-via">{r.via}</span>
              <span className="recent-status" data-status={r.status === 'warning' ? 'warning' : 'ok'}>
                <Icon name={r.status === 'warning' ? 'warning' : 'check-circle'} size={14} />
                {r.statusText}
              </span>
            </div>
            <span className="recent-note">{r.note}</span>
          </li>
        ))}
      </ul>
      <p className="recent-foot">Every upload, URL and repository is listed in Sources. <RouterLink to="/sources">Back to Sources</RouterLink></p>
    </aside>
  );
}
