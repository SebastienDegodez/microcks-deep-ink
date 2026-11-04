import '../explore-kit/explore.css';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import {
  RECOGNIZED_FORMATS, validateArtifactUrl, validateDirectApi, validateGitForm,
  type DirectApiInput, type ImportPreview, type ImportResult, type ImportSource,
} from '@/domain/importing';
import { ValidationError } from '@/application/shared';
import { PageHeader, useAnnounce, useQuery, useRelativeTime, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { Chip } from '@/ui/components/ui/chip';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { DropZone } from '@/ui/components/ui/drop-zone';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input, Textarea } from '@/ui/components/ui/input';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import { Segmented } from '@/ui/components/ui/segmented';
import { Select } from '@/ui/components/ui/select';
import { DataTable } from '@/ui/components/ui/table';
import { TabPanel, Tabs } from '@/ui/components/ui/tabs';
import { pluralize } from '../explore-kit/format';

type Step = 'idle' | 'analyzing' | 'detected' | 'importing' | 'done';
type SourceTab = 'file' | 'url' | 'git' | 'direct';

const STEPS = ['Source', 'Preview', 'Done'];
const SAMPLE_URL = 'https://raw.githubusercontent.com/microcks/microcks/master/samples/APIPastry-openapi.yaml';
const EMPTY_DIRECT = { type: 'REST' as DirectApiInput['type'], name: '', version: '', resource: '', payload: '' };

export default function ImportPage() {
  usePageTitle('Add a source · Microcks');
  const uc = useUseCases();
  const announce = useAnnounce();
  const relative = useRelativeTime();
  const recent = useQuery(() => uc.importing.recentImports(3), [uc]);
  const secrets = useQuery(() => uc.importing.listSecrets(), [uc]);
  const [step, setStep] = useState<Step>('idle');
  const [tab, setTab] = useState<SourceTab>('file');
  const [source, setSource] = useState<ImportSource | undefined>();
  const [preview, setPreview] = useState<ImportPreview | undefined>();
  const [result, setResult] = useState<ImportResult | undefined>();
  const [role, setRole] = useState<'primary' | 'secondary'>('primary');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [url, setUrl] = useState('');
  const [git, setGit] = useState({ name: '', url: '', secret: '', insecure: false });
  const [direct, setDirect] = useState(EMPTY_DIRECT);
  const [touched, setTouched] = useState(false);

  const urlError = touched && tab === 'url' ? validateArtifactUrl(url) : undefined;
  const gitErrors = touched && tab === 'git' ? validateGitForm({ name: git.name, url: git.url }) : {};
  const directErrors = touched && tab === 'direct' ? validateDirectApi(direct) : {};
  const secretNames = secrets.data ?? [];

  const analyze = async (src: ImportSource) => {
    setError(undefined);
    setSource(src);
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
      announce('Import done. The mock is live.');
    } catch {
      setStep('detected');
      setError('The import failed. Try again.');
    }
  };
  const createDirect = async () => {
    setTouched(true);
    if (Object.keys(validateDirectApi(direct)).length) return;
    setStep('importing');
    try {
      const r = await uc.importing.createDirectApi({ ...direct, payload: direct.payload || undefined });
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
    setSource(undefined);
    setRole('primary');
    setSecret('');
    setError(undefined);
    setTouched(false);
    setDirect(EMPTY_DIRECT);
  };
  const stepIndex = step === 'idle' || step === 'analyzing' ? 0 : step === 'detected' || (step === 'importing' && preview) ? 1 : 2;
  const arazzo = preview?.arazzo;

  return (
    <div className="ex-stack">
      <PageHeader
        title="Add a source"
        breadcrumb={[{ label: 'Sources', to: '/sources' }, { label: 'Add a source' }]}
      />
      <p className="ex-secondary" style={{ margin: 0 }}>Upload a file once, or point Microcks to a URL or a Git repository it keeps in sync. You see what it understood before anything is created.</p>
      <ol className="ex-stepper" aria-label="Import progress">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === stepIndex ? 'step' : undefined}>
            <span aria-hidden="true">{i < stepIndex ? <Icon name="check" size={14} /> : i + 1}</span> {label}
            {i < stepIndex ? <span className="sr-only"> (done)</span> : null}
          </li>
        ))}
      </ol>
      {error ? <Callout tone="danger" live="assertive" title="Something went wrong">{error}</Callout> : null}

      <div className="ex-grid ex-grid-2">
        <section aria-label="Import" className="ex-stack" aria-busy={step === 'analyzing' || step === 'importing'}>
          {step === 'idle' || step === 'analyzing' ? (
            <Panel title="Choose the source" headingLevel={2}>
              <Tabs
                label="Contract source"
                idPrefix="imp"
                value={tab}
                onChange={(id) => { setTab(id as SourceTab); setTouched(false); setError(undefined); }}
                items={[
                  { id: 'file', label: 'File' },
                  { id: 'url', label: 'URL' },
                  { id: 'git', label: 'Git repository' },
                  { id: 'direct', label: 'Direct API' },
                ]}
              >
                <TabPanel id="file" idPrefix="imp" value={tab}>
                  <div className="ex-stack">
                    <DropZone
                      heading="Drop a contract here"
                      hint="One or more files, anywhere on the page. Formats .yaml, .json, .xml, .wsdl, .proto, .graphql, .har"
                      multiple
                      accept=".yaml,.yml,.json,.xml,.wsdl,.proto,.graphql,.har"
                      onFiles={(files) => void analyze({ kind: 'file', files: files.map((f) => ({ name: f.name, sizeBytes: f.size })) })}
                    />
                    <div className="ex-row">
                      <span className="ex-secondary">No contract at hand?</span>
                      <Button variant="secondary" size="sm" onClick={() => void analyze({ kind: 'file', files: [{ name: 'apipastry-openapi.yaml', sizeBytes: 5120 }] })}>Sample: API Pastry</Button>
                      <Button variant="secondary" size="sm" onClick={() => void analyze({ kind: 'file', files: [{ name: 'pastry-workflows.arazzo.yaml', sizeBytes: 9216 }] })}>Example: Pastry workflows (Arazzo)</Button>
                      <Button variant="secondary" size="sm" onClick={() => void analyze({ kind: 'file', files: [{ name: 'agent-card.json', sizeBytes: 3277 }] })}>Example: Pastry concierge (A2A Agent Card)</Button>
                    </div>
                    <p className="ex-small ex-secondary">One-off upload: relative references are only resolved if a default artifact repository is configured. To follow a contract as it evolves, prefer a Git repository.</p>
                  </div>
                </TabPanel>
                <TabPanel id="url" idPrefix="imp" value={tab}>
                  <form className="ex-stack" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!validateArtifactUrl(url)) void analyze({ kind: 'url', url: url.trim() }); }} noValidate>
                    <Field label="Artifact URL" help="Microcks downloads the file once. An authentication Secret can be chosen in the next step." error={urlError}>
                      {(c) => <Input {...c} type="url" placeholder={SAMPLE_URL} value={url} onChange={(e) => setUrl(e.target.value)} />}
                    </Field>
                    <div className="ex-row"><Button type="submit" loading={step === 'analyzing'}>Analyze URL</Button><Button type="button" variant="ghost" onClick={() => setUrl(SAMPLE_URL)}>Use the API Pastry sample URL</Button></div>
                  </form>
                </TabPanel>
                <TabPanel id="git" idPrefix="imp" value={tab}>
                  <form className="ex-stack" onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!Object.keys(validateGitForm({ name: git.name, url: git.url })).length) void analyze({ kind: 'git', repository: git.url.trim(), name: git.name.trim(), secretName: git.secret || undefined, insecure: git.insecure }); }} noValidate>
                    <Field label="Source name" error={gitErrors.name}>{(c) => <Input {...c} placeholder="API Pastry — main" value={git.name} onChange={(e) => setGit({ ...git, name: e.target.value })} />}</Field>
                    <Field label="File URL in the repository" error={gitErrors.url}>{(c) => <Input {...c} type="url" placeholder="https://raw.githubusercontent.com/acme/contracts/main/pastry/openapi.yaml" value={git.url} onChange={(e) => setGit({ ...git, url: e.target.value })} />}</Field>
                    <Field label="Authentication Secret">
                      {(c) => (
                        <Select {...c} value={git.secret} onChange={(e) => setGit({ ...git, secret: e.target.value })}>
                          <option value="">None (public repository)</option>
                          {secretNames.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </Select>
                      )}
                    </Field>
                    <Checkbox label="Disable SSL validation" checked={git.insecure} onChange={(e) => setGit({ ...git, insecure: e.target.checked })} />
                    <p className="ex-small ex-secondary">Scheduled source: Microcks re-scans the file on the global <code>services.update.interval</code> (every hour by default) and resolves external references. <RouterLink to="/sources">Manage sources</RouterLink></p>
                    <div><Button type="submit" loading={step === 'analyzing'}>Analyze repository</Button></div>
                  </form>
                </TabPanel>
                <TabPanel id="direct" idPrefix="imp" value={tab}>
                  <form className="ex-stack" onSubmit={(e) => { e.preventDefault(); void createDirect(); }} noValidate>
                    <p className="ex-secondary" style={{ margin: 0 }}>No contract yet? Describe a resource: Microcks generates the artifact and serves a mock that accepts any JSON.</p>
                    <Segmented label="Direct API type" value={direct.type} onChange={(id) => setDirect({ ...direct, type: id as DirectApiInput['type'] })} options={[{ id: 'REST', label: 'REST · Generic REST API' }, { id: 'GENERIC_EVENT', label: 'EVENT · Generic event-driven API' }]} />
                    <p className="ex-small ex-secondary" style={{ margin: 0 }}>{direct.type === 'REST' ? 'CRUD on a resource, dynamic storage.' : 'Publishes a reference payload on a topic.'}</p>
                    <Field label="API name" error={directErrors.name}>{(c) => <Input {...c} placeholder="Order API" value={direct.name} onChange={(e) => setDirect({ ...direct, name: e.target.value })} />}</Field>
                    <Field label="Version" error={directErrors.version}>{(c) => <Input {...c} placeholder="1.0" value={direct.version} onChange={(e) => setDirect({ ...direct, version: e.target.value })} />}</Field>
                    <Field label="Resource" error={directErrors.resource}>{(c) => <Input {...c} placeholder="order" value={direct.resource} onChange={(e) => setDirect({ ...direct, resource: e.target.value })} />}</Field>
                    <Field label={`Reference JSON payload ${direct.type === 'GENERIC_EVENT' ? '(required, published as is)' : '(optional, used as a template)'}`} error={directErrors.payload}>
                      {(c) => <Textarea {...c} mono rows={4} spellCheck={false} placeholder='{ "id": "ord-1042", "customer": "Laurent", "status": "CREATED" }' value={direct.payload} onChange={(e) => setDirect({ ...direct, payload: e.target.value })} />}
                    </Field>
                    <div><Button type="submit">Create mock</Button></div>
                  </form>
                </TabPanel>
              </Tabs>
              {tab !== 'direct' ? (
                <div className="ex-row" style={{ marginTop: 12 }}>
                  <span className="ex-small ex-secondary">Recognized formats</span>
                  {RECOGNIZED_FORMATS.map((f) => <Chip key={f} variant="outline">{f}</Chip>)}
                </div>
              ) : null}
            </Panel>
          ) : null}

          {(step === 'detected' || (step === 'importing' && preview)) && preview ? (
            <Panel title="Preview before import">
              <p className="ex-secondary" style={{ marginTop: 0 }}>Nothing has been created yet. Here is what Microcks detected in the artifact.</p>
              <p className="ex-row"><code>{preview.artifactName}</code><span className="ex-small ex-secondary">{preview.origin}</span></p>
              {arazzo ? (
                <div className="ex-stack">
                  <p role="status" className="ex-row"><Icon name="check" size={14} /> Valid Arazzo {arazzo.arazzoVersion} · title “{arazzo.title}” {arazzo.version} · {arazzo.workflows.length} workflows · {arazzo.sources.length} source descriptions</p>
                  <p className="ex-row"><Chip>Arazzo {arazzo.arazzoVersion}</Chip> <ApiBadge arazzo name={`${arazzo.title} ${arazzo.version}`} /></p>
                  <h3>{arazzo.workflows.length} workflows discovered · {arazzo.workflows.reduce((n, w) => n + w.steps, 0)} steps</h3>
                  <ul className="ex-plain-list">
                    {arazzo.workflows.map((w) => (
                      <li key={w.workflowId} className="ex-row-between">
                        <span><strong>{w.name}</strong> <span className="ex-small ex-secondary">workflowId: {w.workflowId}</span>{w.note ? <span className="ex-small"> · {w.blocked ? <Icon name="warning" size={12} /> : null} {w.note}</span> : null}</span>
                        <span className="ex-small">{w.steps} steps</span>
                      </li>
                    ))}
                  </ul>
                  <h3>Link source descriptions to Microcks APIs · {arazzo.sources.length} of {arazzo.sources.length} linked</h3>
                  <p className="ex-secondary">Each step calls an operation of a source description. Link each one to an API already imported in Microcks: its operations are checked now, and its mocks become a run target.</p>
                  <DataTable
                    caption="Source descriptions"
                    captionHidden
                    rowKey="name"
                    rows={arazzo.sources}
                    columns={[
                      { key: 'name', header: 'Source description', render: (d) => <><code>{d.name}</code> <span className="ex-small ex-secondary">{d.type}</span></> },
                      { key: 'url', header: 'Declared URL', mono: true },
                      { key: 'service', header: 'Microcks API', render: (d) => <span className="ex-row"><ApiBadge protocol={d.protocol} size="sm" /> {d.service} <Chip tone="success"><Icon name="check" size={12} /> Linked · MATCHED</Chip></span> },
                      { key: 'operationsFound', header: 'Step operations' },
                    ]}
                  />
                  <p className="ex-small ex-secondary">Linked through the ArazzoSources overlay <code>pastry-workflows.arazzo-sources.yaml</code>, or link them here.</p>
                  <div role="note" className="ex-small">Arazzo documents outside the supported subset are refused (e.g. goto actions, jsonpath criteria, workflowId steps). Success criteria use the simple and regex types; step actions are end and retry.</div>
                </div>
              ) : preview.agent ? (
                <div className="ex-stack">
                  <p role="status" className="ex-row"><Icon name="check" size={14} /> Valid A2A Agent Card · provider {preview.agent.provider} · {preview.agent.skills.length} skills · {preview.agent.interfaces.length} interfaces · security {preview.agent.security}</p>
                  <p className="ex-row"><Chip>{preview.formatLabel}</Chip> <ApiBadge protocol="A2A" name="Pastry concierge" version="1.0" /><Chip variant="outline">Projection · v2 module</Chip></p>
                  <h3>{preview.agent.skills.length} skills discovered · each one becomes an operation</h3>
                  <ul className="ex-plain-list">
                    {preview.agent.skills.map((k) => <li key={k.id} className="ex-row"><MethodTag method="SKILL" protocol="A2A" /><span className="ex-mono">{k.id}</span><span className="ex-small ex-secondary">{k.name}</span></li>)}
                  </ul>
                  <h3>{preview.agent.interfaces.length} interfaces · supportedInterfaces, in order</h3>
                  <ol className="ex-plain-list">
                    {preview.agent.interfaces.map((i, n) => (
                      <li key={i.binding} className="ex-row"><span className="ex-mono">{i.binding}</span><span className="ex-mono ex-small ex-secondary">{i.url}</span>{i.preferred ? <Chip tone="info">preferred</Chip> : null}<span className="sr-only">{`Mock: ${preview.agent?.mockInterfaces[n]?.url ?? ''}`}</span></li>
                    ))}
                  </ol>
                  <p className="ex-small ex-secondary" style={{ margin: 0 }}>Capabilities {preview.agent.capabilities.join(', ')} · Modes {preview.agent.modes.join(', ')}</p>
                  <Callout tone="info" title="No conversations yet">
                    <p>Add an APIExamples secondary artifact to give the mock its conversations. The card alone describes skills, not what the agent answers. The mock serves the card with supportedInterfaces rewritten to point at Microcks, on all {preview.agent.mockInterfaces.length} transports.</p>
                  </Callout>
                </div>
              ) : (
                <div className="ex-stack">
                  {preview.services.map((s) => (
                    <div key={`${s.name}${s.version}`} className="ex-stack">
                      <p className="ex-row"><Chip>{preview.formatLabel}</Chip> <ApiBadge protocol={s.protocol} name={s.name} version={s.version} />{s.exists ? <Chip tone="info">already in the catalogue</Chip> : null}</p>
                      <h3>{pluralize(s.operations.length, 'Operation')} discovered · {preview.exampleCount ?? 0} Examples</h3>
                      <ul className="ex-plain-list">
                        {s.operations.map((o) => (
                          <li key={`${o.method}${o.path}`} className="ex-row-between">
                            <span className="ex-row"><MethodTag method={o.method} protocol={s.protocol} /><span className="ex-mono">{o.path}</span></span>
                            <span className="ex-small ex-secondary">{o.dispatcher} · {pluralize(o.exampleCount ?? 0, 'example')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <h3 id="role-title">Artifact role</h3>
                  <Segmented label="Artifact role" value={role} onChange={(id) => setRole(id as 'primary' | 'secondary')} options={[{ id: 'primary', label: 'Primary' }, { id: 'secondary', label: 'Secondary' }]} />
                  <p className="ex-small ex-secondary" style={{ margin: 0 }}>
                    {role === 'secondary'
                      ? 'Secondary: merges only non-conflicting Examples into an existing API, matched by name + version (here API Pastry 2.0). Ignored if no API matches.'
                      : 'Primary: brings the Service structure, its Operations and its Examples. This is the default; then add secondary Artifacts (Postman, HAR, APIExamples) to enrich the Examples.'}
                  </p>
                  {source?.kind === 'url' ? (
                    <Field label="Authentication Secret (optional, for a protected URL)">
                      {(c) => (
                        <Select {...c} value={secret} onChange={(e) => setSecret(e.target.value)}>
                          <option value="">None</option>
                          {secretNames.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </Select>
                      )}
                    </Field>
                  ) : null}
                  {source?.kind === 'git' ? <p className="ex-small ex-secondary">The source “{source.name}” will be created, scanned and imported immediately, then re-scanned every hour. <RouterLink to="/sources">Manage sources</RouterLink></p> : null}
                </div>
              )}
              <div className="ex-row" style={{ marginTop: 12 }}>
                <Button loading={step === 'importing'} onClick={() => void doImport()}>{arazzo ? `Import ${arazzo.workflows.length} workflows` : source?.kind === 'git' ? 'Create source' : 'Import'}</Button>
                <Button variant="secondary" onClick={reset}>Cancel</Button>
              </div>
            </Panel>
          ) : null}

          {step === 'importing' && !preview ? <p role="status">Creating the mock…</p> : null}

          {step === 'done' && result ? (
            <Panel title={doneTitle(result)}>
              <div role="status" className="ex-stack">
                <p style={{ margin: 0 }}>{doneSub(result)}</p>
                {result.outcome === 'arazzo' && result.arazzo ? (
                  <>
                    <p className="ex-row"><ApiBadge arazzo name={`${result.name} ${result.version}`} /><ApiBadge label="workflows" value={String(result.arazzo.workflows)} size="sm" /><ApiBadge label="steps" value={String(result.arazzo.steps)} size="sm" /></p>
                    <div className="ex-row"><Button asChild><RouterLink to="/workflows">Open workflows</RouterLink></Button><Button asChild variant="secondary"><RouterLink to="/sources">Back to Sources</RouterLink></Button><Button variant="secondary" onClick={reset}>Add another source</Button></div>
                  </>
                ) : (
                  <>
                    <p className="ex-row">
                      {result.protocol && result.protocol !== 'ARAZZO' ? <ApiBadge protocol={result.protocol} name={result.name} version={result.version} /> : null}
                      {result.mcp ? <ApiBadge label="mcp" value="agent-ready" status="info" size="sm" /> : null}
                      <ApiBadge label="samples" value={result.samples ?? '0'} size="sm" />
                    </p>
                    <div className="ex-stack" style={{ gap: 4 }}>
                      <span id="mock-url-label" className="ex-small ex-secondary">{result.mockLabel}</span>
                      <div className="ex-row" aria-labelledby="mock-url-label" role="group"><code className="ex-url-line">{result.mockUrl}</code><CopyButton value={result.mockUrl ?? ''} label="Copy" /></div>
                    </div>
                    {result.tryIt ? <CodeBlock code={result.tryIt} language="shell" caption="Try it now" copy /> : null}
                    <div className="ex-row">
                      <Button asChild><RouterLink to={`/services/${result.serviceId}`}>Open service</RouterLink></Button>
                      <Button asChild variant="secondary"><RouterLink to="/sources">Back to Sources</RouterLink></Button>
                      <Button variant="secondary" onClick={reset}>Add another source</Button>
                      <Button asChild variant="secondary"><RouterLink to={result.protocol === 'A2A' ? `/tests/agent?service=${result.serviceId}` : `/tests/create?service=${result.serviceId}`}>{result.protocol === 'A2A' ? 'Test the agent' : 'Run a test'}</RouterLink></Button>
                    </div>
                  </>
                )}
              </div>
            </Panel>
          ) : null}
        </section>

        <aside aria-labelledby="recent-title" className="ex-stack">
          <Panel title="Recent sources" id="recent-title" actions={<RouterLink to="/services">Full catalog</RouterLink>}>
            <ul className="ex-plain-list">
              {(recent.data ?? []).map((r) => (
                <li key={r.id} className="ex-stack" style={{ gap: 2 }}>
                  <span className="ex-row">{r.protocol === 'ARAZZO' ? <ApiBadge arazzo size="sm" /> : <ApiBadge protocol={r.protocol} size="sm" />}<strong>{r.name}</strong><span className="ex-small ex-muted">{relative(r.at)}</span></span>
                  <span className="ex-small ex-secondary">{r.via} · <Icon name={r.status === 'warning' ? 'warning' : 'check'} size={12} /> {r.statusText} · {r.note}</span>
                </li>
              ))}
            </ul>
            <p className="ex-small ex-secondary">Every upload, URL and repository is listed in Sources. <RouterLink to="/sources">Back to Sources</RouterLink></p>
          </Panel>
          <Panel title="From the command line" headingLevel={2}>
            <CodeBlock code={'microcks import apipastry-openapi.yaml:true \\\n  --microcksURL=http://microcks.local:8080/api/'} language="shell" caption="Microcks CLI" copy />
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function doneTitle(r: ImportResult): string {
  switch (r.outcome) {
    case 'importer-created': return 'Source created, mock is live';
    case 'a2a': return 'Agent imported, mock is live';
    case 'merged': return 'Examples merged';
    case 'arazzo': return `${r.arazzo?.workflows ?? 0} workflows imported`;
    case 'direct': return 'Mock created and live';
    default: return 'Mock is live';
  }
}
function doneSub(r: ImportResult): string {
  switch (r.outcome) {
    case 'importer-created': return `First scan of “${r.importerName ?? r.name}” done: ${r.operationCount} Operations, ${r.samples ?? 0} Examples served. Next re-scan in 2 h.`;
    case 'merged': return `Non-conflicting Examples were added to ${r.name} ${r.version} (name + version key). The mock already serves them.`;
    case 'arazzo': return `${r.name} ${r.version}: ${r.arazzo?.workflows} workflows, ${r.arazzo?.steps} steps, ${r.arazzo?.sources} source descriptions linked. Play them on the Microcks mocks or run them against your implementations; order-pastry cannot run yet (AsyncAPI steps).`;
    case 'a2a': return `${r.name} ${r.version} is imported as an A2A service: ${r.agent?.skills ?? 0} skills became operations and the mock serves the card on ${r.agent?.transports.length ?? 0} transports. It answers with a rejected task until conversations are added.`;
    case 'direct': return r.protocol === 'EVENT' ? `${r.name} ${r.version} publishes the reference payload at a regular interval.` : `${r.name} ${r.version} exposes the resource: create, read, filter and delete with free-form JSON.`;
    default: return `${r.name} ${r.version} is imported: ${r.operationCount} Operations, ${r.samples} Examples served by the mock.`;
  }
}
