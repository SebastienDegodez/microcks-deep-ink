<script lang="ts">
  import '@microcks/demo-styles/pages/import/import.css';
  import { ValidationError } from '@microcks/demo-core/application/shared';
  import {
    RECOGNIZED_FORMATS, validateArtifactUrl, validateDirectApi, validateGitForm,
    type ImportPreview, type ImportResult, type ImportSource, type RecentImport,
  } from '@microcks/demo-core/domain/importing';
  import { ApiBadge, Button, Callout, Checkbox, Chip, DropZone, Field, Icon, Input, Textarea, Select, SplitPane, SplitPaneMain, SplitPaneSide, TabPanel, Tabs } from '@microcks/deep-ink';
  import { PageHeader, RouterLink, useAnnounce, useQuery, useRelativeTime, useUseCases, usePageTitle } from '@/ui/app';
  import ImportDone from './ImportDone.svelte';
  import ImportPreviewCard from './ImportPreviewCard.svelte';
  import {
    DIRECT_DEFAULTS, EMPTY_DIRECT, GIT_DEFAULTS, SAMPLE_URL, SAMPLES, SOURCE_TABS, importStepIndex, importSteps, or, resolveDirect, resolveGit,
    type ImportStep, type SourceTab,
  } from './source';

  /** `/sources/new`: upload a file, point to a URL or a Git repository, or describe a Direct API, then preview and import it. */
  usePageTitle(() => 'Add a source · Microcks');
  const uc = useUseCases();
  const announce = useAnnounce();
  const relative = useRelativeTime();
  let step = $state<ImportStep>('idle');
  let tab = $state<SourceTab>('file');
  let preview = $state.raw<ImportPreview | undefined>();
  let result = $state.raw<ImportResult | undefined>();
  let role = $state<'primary' | 'secondary'>('primary');
  let secret = $state('');
  let error = $state<string | undefined>();
  let url = $state('');
  let git = $state.raw({ name: '', url: '', secret: '', insecure: false });
  let direct = $state.raw(EMPTY_DIRECT);
  let touched = $state(false);
  const recent = useQuery(() => uc.importing.recentImports(3), () => [uc, result]);
  const secrets = useQuery(() => uc.importing.listSecrets(), () => [uc]);

  const resolvedUrl = $derived(or(url, SAMPLE_URL));
  const resolvedGit = $derived(resolveGit(git));
  const resolvedDirect = $derived(resolveDirect(direct));
  const urlError = $derived(touched && tab === 'url' ? validateArtifactUrl(resolvedUrl) : undefined);
  const gitErrors = $derived(touched && tab === 'git' ? validateGitForm(resolvedGit) : {});
  const directErrors = $derived(touched && tab === 'direct' ? validateDirectApi(resolvedDirect) : {});
  const secretNames = $derived(secrets.data ?? []);

  const analyze = async (src: ImportSource) => {
    error = undefined;
    step = 'analyzing';
    announce('Analyzing the artifact…');
    try {
      const p = await uc.importing.analyze(src);
      preview = p;
      step = 'detected';
      announce('Preview ready. Nothing has been created yet.');
    } catch (e) {
      step = 'idle';
      error = e instanceof ValidationError ? e.message : 'The artifact could not be analyzed.';
    }
  };
  const doImport = async () => {
    if (!preview) return;
    step = 'importing';
    announce('Importing…');
    try {
      const secretId = secretNames.find((s) => s.name === secret)?.id;
      const r = await uc.importing.import(preview.previewId, { role, secretId });
      result = r;
      step = 'done';
      announce('Source created. The mock is live.');
    } catch {
      step = 'detected';
      error = 'The import failed. Try again.';
    }
  };
  const createDirect = async () => {
    touched = true;
    if (Object.keys(validateDirectApi(resolvedDirect)).length) return;
    step = 'importing';
    try {
      const r = await uc.importing.createDirectApi(resolvedDirect);
      result = r;
      preview = undefined;
      step = 'done';
      announce('Mock created and live.');
    } catch (e) {
      step = 'idle';
      error = e instanceof Error ? e.message : 'The mock could not be created.';
    }
  };
  const reset = () => {
    step = 'idle';
    preview = undefined;
    result = undefined;
    role = 'primary';
    secret = '';
    error = undefined;
    touched = false;
    direct = EMPTY_DIRECT;
  };
  const stepIndex = $derived(importStepIndex(step, Boolean(preview)));
  const directDone = $derived(step === 'done' && result?.outcome === 'direct');
  const steps = $derived(importSteps(directDone));
</script>

{#snippet actions()}<ol class="import-stepper" aria-label="Progress"
    >{#each steps as label, i (label)}{@const done = i < stepIndex || (step === 'done' && i === 2)}<li
        data-state={done ? 'done' : i === stepIndex ? 'current' : 'upcoming'}
        aria-current={i === stepIndex ? 'step' : undefined}
        ><span class="import-stepper-dot" aria-hidden="true">{i + 1}</span>{label}{#if done}<span class="sr-only">{' (done)'}</span>{/if}</li
      >{/each}</ol
  >{/snippet}

{#snippet payloadLabel()}Reference JSON payload <span class="field-hint"
    >{direct.type === 'GENERIC_EVENT' ? '(required, published as is)' : '(optional, used as a template)'}</span
  >{/snippet}

{#snippet recentSources(items: RecentImport[])}<SplitPaneSide as="aside" aria-labelledby="recent-title" class="recent"
    ><div class="recent-head"><h2 id="recent-title">Recent sources</h2><RouterLink to="/services">Full catalog</RouterLink></div
    ><ul class="recent-list"
      >{#each items as r (r.id)}<li
          ><div class="recent-line"
            >{#if r.protocol === 'ARAZZO'}<ApiBadge arazzo name={r.name} size="sm" />{:else}<ApiBadge protocol={r.protocol} name={r.name} size="sm" />{/if}<span
              class="recent-when">{relative(r.at)}</span
            ></div
          ><div class="recent-line"
            ><span class="recent-via">{r.via}</span><span class="recent-status" data-status={r.status === 'warning' ? 'warning' : 'ok'}
              ><Icon name={r.status === 'warning' ? 'warning' : 'check-circle'} size={14} />{r.statusText}</span
            ></div
          ><span class="recent-note">{r.note}</span></li
        >{/each}</ul
    ><p class="recent-foot">Every upload, URL and repository is listed in Sources. <RouterLink to="/sources">Back to Sources</RouterLink></p></SplitPaneSide
  >{/snippet}

<div class="import" data-main-pad="roomy"
  ><PageHeader
    title="Add a source"
    variant="plain"
    descriptionTone="secondary"
    breadcrumb={[{ label: 'Sources', to: '/sources' }, { label: 'Add a source' }]}
    description="Upload a file once, or point Microcks to a URL or a Git repository it keeps in sync. You see what it understood before anything is created."
    {actions}
  />{#if error}<Callout tone="danger" live="assertive" title="Something went wrong">{error}</Callout>{/if}<SplitPane
    gap="24px"
    sideWidth="302px"
    sideMax="none"
    mainWidth="560px"
    ><SplitPaneMain as="section" aria-label="Add a source" class="import-workspace" aria-busy={step === 'analyzing' || step === 'importing'}
      >{#if step === 'idle' || step === 'analyzing'}<div class="source-box"
          ><Tabs
            label="Source type"
            idPrefix="imp"
            value={tab}
            onchange={(id) => {
              tab = id as SourceTab;
              touched = false;
              error = undefined;
            }}
            items={SOURCE_TABS}
            ><TabPanel id="file" idPrefix="imp" value={tab} class="source-panel"
              ><DropZone
                heading="Drop a contract here"
                hint="One or more files, anywhere on the page. Formats .yaml, .json, .xml, .wsdl, .proto, .graphql, .har"
                chooseLabel="Browse"
                multiple
                accept=".yaml,.yml,.json,.xml,.wsdl,.proto,.graphql,.har"
                onfiles={(files) => void analyze({ kind: 'file', files: files.map((f) => ({ name: f.name, sizeBytes: f.size })) })}
              /><div class="source-samples"
                ><span>No contract at hand?</span>{#each SAMPLES as s (s.label)}<Button
                    variant="link"
                    icon="arrow-right"
                    onclick={() => void analyze({ kind: 'file', sample: true, files: [s.file] })}>{s.label}</Button
                  >{/each}</div
              ><p class="source-help"
                >One-off upload: relative references are only resolved if a default artifact repository is configured. To follow a contract as it evolves,
                prefer a Git repository.</p
              ></TabPanel
            ><TabPanel id="url" idPrefix="imp" value={tab} class="source-panel"
              ><form
                class="source-form"
                onsubmit={(e) => {
                  e.preventDefault();
                  touched = true;
                  if (!validateArtifactUrl(resolvedUrl)) void analyze({ kind: 'url', url: resolvedUrl });
                }}
                novalidate
                ><Field
                  label="Artifact URL"
                  help="Microcks downloads the file now, then fetches it again on the global schedule to keep the mock in sync. An authentication Secret can be chosen in the next step."
                  error={urlError}
                  >{#snippet children(c)}<Input {...c} mono type="url" placeholder={SAMPLE_URL} value={url} oninput={(e) => (url = e.currentTarget.value)} />{/snippet}</Field
                ><div class="source-actions"><Button type="submit" variant="primary" loading={step === 'analyzing'}>Analyze URL</Button></div></form
              ></TabPanel
            ><TabPanel id="git" idPrefix="imp" value={tab} class="source-panel"
              ><form
                class="source-form"
                onsubmit={(e) => {
                  e.preventDefault();
                  touched = true;
                  if (!Object.keys(validateGitForm(resolvedGit)).length) {
                    void analyze({ kind: 'git', repository: resolvedGit.url, name: resolvedGit.name, secretName: git.secret || undefined, insecure: git.insecure });
                  }
                }}
                novalidate
                ><div class="source-row"
                  ><Field label="Source name" error={gitErrors.name}
                    >{#snippet children(c)}<Input
                        {...c}
                        placeholder={GIT_DEFAULTS.name}
                        value={git.name}
                        oninput={(e) => (git = { ...git, name: e.currentTarget.value })}
                      />{/snippet}</Field
                  ><div data-grow="2"
                    ><Field label="File URL in the repository" error={gitErrors.url}
                      >{#snippet children(c)}<Input
                          {...c}
                          mono
                          type="url"
                          placeholder={GIT_DEFAULTS.url}
                          value={git.url}
                          oninput={(e) => (git = { ...git, url: e.currentTarget.value })}
                        />{/snippet}</Field
                    ></div
                  ></div
                ><div class="source-row"
                  ><Field label="Authentication Secret"
                    >{#snippet children(c)}<Select {...c} value={git.secret} onchange={(e) => (git = { ...git, secret: e.currentTarget.value })}
                        ><option value="">None (public repository)</option>{#each secretNames as s (s.id)}<option value={s.name}>{s.name}</option>{/each}</Select
                      >{/snippet}</Field
                  ><Checkbox label="Disable SSL validation" checked={git.insecure} onchange={(e) => (git = { ...git, insecure: e.currentTarget.checked })} /></div
                ><div class="note-box"
                  ><Icon name="clock" size={16} class="note-box-icon" /><span
                    >Scheduled source: Microcks re-scans the file on the global <span class="demo-mono">services.update.interval</span> (every hour by default) and
                    resolves external references. <RouterLink to="/sources">Manage sources</RouterLink></span
                  ></div
                ><div class="source-actions"><Button type="submit" variant="primary" loading={step === 'analyzing'}>Analyze repository</Button></div></form
              ></TabPanel
            ><TabPanel id="direct" idPrefix="imp" value={tab} class="source-panel"
              ><form
                class="source-form"
                onsubmit={(e) => {
                  e.preventDefault();
                  void createDirect();
                }}
                novalidate
                ><p class="source-lead">No contract yet? Describe a resource: Microcks generates the artifact and serves a mock that accepts any JSON.</p><div
                  role="group"
                  aria-label="Direct API type"
                  class="type-cards"
                  ><button type="button" class="type-card" aria-pressed={direct.type === 'REST'} onclick={() => (direct = { ...direct, type: 'REST' })}
                    ><span class="type-card-tag" data-protocol="direct">REST</span><span class="type-card-title">Generic REST API</span><span
                      class="type-card-sub">CRUD on a resource, dynamic storage</span
                    ></button
                  ><button
                    type="button"
                    class="type-card"
                    aria-pressed={direct.type === 'GENERIC_EVENT'}
                    onclick={() => (direct = { ...direct, type: 'GENERIC_EVENT' })}
                    ><span class="type-card-tag" data-protocol="event">EVENT</span><span class="type-card-title">Generic event-driven API</span><span
                      class="type-card-sub">Publishes a reference payload on a topic</span
                    ></button
                  ></div
                ><div class="source-row"
                  ><div data-grow="2"
                    ><Field label="API name" error={directErrors.name}
                      >{#snippet children(c)}<Input
                          {...c}
                          placeholder={DIRECT_DEFAULTS.name}
                          value={direct.name}
                          oninput={(e) => (direct = { ...direct, name: e.currentTarget.value })}
                        />{/snippet}</Field
                    ></div
                  ><div data-basis="version"
                    ><Field label="Version" error={directErrors.version}
                      >{#snippet children(c)}<Input
                          {...c}
                          mono
                          placeholder={DIRECT_DEFAULTS.version}
                          value={direct.version}
                          oninput={(e) => (direct = { ...direct, version: e.currentTarget.value })}
                        />{/snippet}</Field
                    ></div
                  ><div data-basis="resource"
                    ><Field label="Resource" error={directErrors.resource}
                      >{#snippet children(c)}<Input
                          {...c}
                          mono
                          placeholder={DIRECT_DEFAULTS.resource}
                          value={direct.resource}
                          oninput={(e) => (direct = { ...direct, resource: e.currentTarget.value })}
                        />{/snippet}</Field
                    ></div
                  ></div
                ><Field label={payloadLabel} error={directErrors.payload}
                  >{#snippet children(c)}<Textarea
                      {...c}
                      mono
                      rows={4}
                      spellcheck={false}
                      placeholder={DIRECT_DEFAULTS.payload}
                      value={direct.payload}
                      oninput={(e) => (direct = { ...direct, payload: e.currentTarget.value })}
                    />{/snippet}</Field
                ><div class="source-actions"><Button type="submit" variant="primary">Create mock</Button></div></form
              ></TabPanel
            ></Tabs
          >{#if tab !== 'direct'}<div class="formats"
              ><span class="formats-label">Recognized formats</span>{#each RECOGNIZED_FORMATS as f (f)}<Chip class="format-chip">{f}</Chip>{/each}</div
            >{/if}</div
        >{/if}{#if (step === 'detected' || (step === 'importing' && preview)) && preview}<ImportPreviewCard
          {preview}
          {role}
          onrolechange={(value) => (role = value)}
          {secret}
          onsecretchange={(value) => (secret = value)}
          secretNames={secretNames.map((s) => ({ id: s.id, name: s.name }))}
          importing={step === 'importing'}
          onimport={() => void doImport()}
          oncancel={reset}
        />{/if}{#if step === 'importing' && !preview}<p role="status">Creating the mock…</p>{/if}{#if step === 'done' && result}<ImportDone
          {result}
          onreset={reset}
          nextScanMinutes={uc.importing.getScanSchedule().minutesUntilNext}
        />{/if}</SplitPaneMain
    >{@render recentSources(recent.data ?? [])}</SplitPane
  ></div
>
