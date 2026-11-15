<script lang="ts">
  import '@microcks/demo-styles/pages/explore-kit/explore.css';
  import '@microcks/demo-styles/pages/behavior/behavior.css';
  import '@microcks/demo-styles/pages/behavior/config.css';
  import { isValidRegExp, scriptSample, storedSummary, type Behavior, type ParameterConstraint } from '@microcks/demo-core/domain/catalog';
  import { ApiBadge, Button, Icon, MethodTag, Panel, Segmented, SplitPane, SplitPaneMain, SplitPaneSide, SummaryStrip } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useAnnounce, usePageTitle, useParams, useQuery, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import DispatcherPanel from './DispatcherPanel.svelte';
  import SimulatorPanel from './SimulatorPanel.svelte';
  import { DELAY_PRESETS, constraintCounts, delayHelp, isInferred, mockBaseOf, pathParamsOf, servedExamples } from './config';

  /** The operation behavior screen (06): dispatcher, delay, parameter constraints and stateful mock, tried in the request simulator. */
  const params = useParams();
  const uc = useUseCases();
  const announce = useAnnounce();
  const serviceId = $derived(params.serviceId ?? '');
  const operationId = $derived(params.operationId ?? '');

  const service = useQuery(() => uc.catalog.getService(serviceId), () => [uc, serviceId]);
  const op = useQuery(() => uc.catalog.getOperation(serviceId, operationId), () => [uc, serviceId, operationId]);
  const saved = useQuery(() => uc.catalog.behavior(serviceId, operationId), () => [uc, serviceId, operationId]);
  const examples = useQuery(() => uc.catalog.listExamples(serviceId, operationId), () => [uc, serviceId, operationId]);
  usePageTitle(() => (op.data ? `${op.data.method} ${op.data.path} behavior · Microcks` : 'Operation behavior · Microcks'));

  /** A behavior of one operation, keyed `serviceId/operationId`: a value kept for another operation is ignored. */
  interface Keyed {
    key: string;
    value: Behavior;
  }

  let edits = $state.raw<Keyed | undefined>();
  let switched = $state(false);
  let savedAt = $state(false);
  // What was just saved, shown at once while the saved query reloads.
  let justSaved = $state.raw<Keyed | undefined>();
  const editKey = $derived(`${serviceId}/${operationId}`);
  const draft = $derived(edits?.key === editKey ? edits.value : saved.data);
  const current = $derived(justSaved?.key === editKey ? justSaved.value : saved.data);
  const dirty = $derived(Boolean(draft && current && JSON.stringify(draft) !== JSON.stringify(current)));

  const svc = $derived(service.data);
  const operation = $derived(op.data);
  const exs = $derived(servedExamples(examples.data ?? []));
  const pathParams = $derived(operation ? pathParamsOf(operation.path) : []);
  const inferred = $derived(isInferred(current, pathParams));
  const counts = $derived(draft ? constraintCounts(draft.constraints) : '');

  const edit = (patch: Partial<Behavior>) => {
    if (!draft) return;
    edits = { key: editKey, value: { ...draft, ...patch } };
    savedAt = false;
  };
  const toggleStateful = (on: boolean) => {
    if (!draft) return;
    if (on) {
      const lang = draft.scriptLanguage ?? 'GROOVY';
      edit({ stateful: true, dispatcher: 'SCRIPT', scriptLanguage: lang, script: scriptSample(lang, true) });
      switched = true;
      announce('Stateful mock on. Dispatcher switched to SCRIPT with a view-counter sample.');
    } else {
      // Back to the plain sample of the language; the counters of the store are dropped with it.
      edit({ stateful: false, script: scriptSample(draft.scriptLanguage ?? 'GROOVY', false) });
      switched = false;
    }
  };
  const setConstraint = (i: number, patch: Partial<ParameterConstraint>) => {
    if (!draft) return;
    edit({ constraints: draft.constraints.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  };

  const save = async () => {
    if (!draft) return;
    // The behavior and its key as they are on click: the save may resolve after another edit.
    const key = editKey;
    const value = draft;
    await uc.catalog.saveBehavior(serviceId, operationId, value);
    justSaved = { key, value };
    saved.reload();
    savedAt = true;
    announce('Behavior saved.');
  };
  const reset = () => {
    edits = undefined;
    switched = false;
  };
</script>

{#if op.status === 'error' && !op.data}<PageHeader title="Operation behavior" /><ErrorBlock
    error={op.error}
    what="The operation"
    onretry={op.reload}
  />{:else if !svc || !operation || !draft || !examples.data}<PageHeader title="Operation behavior" /><LoadingBlock
    label="the operation behavior"
  />{:else}
  {#snippet crumb()}<span class="demo-mono">{`${operation.method} ${operation.path}`}</span>{/snippet}
  {#snippet leading()}<MethodTag method={operation.method} protocol={svc.protocol} />{/snippet}
  {#snippet badge()}<RouterLink to={`/services/${svc.id}`} class="behavior-api-link"
      ><ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} size="sm" /></RouterLink
    >{/snippet}
  {#snippet actions()}{#if dirty}<span class="behavior-unsaved"><Icon name="alert-circle" size={14} />Unsaved changes</span>{/if}<Button
      variant="ghost"
      onclick={reset}>Reset</Button
    ><ButtonRouterLink variant="secondary" to={`/services/${svc.id}`}>Cancel</ButtonRouterLink
    ><Button variant="primary" icon="check" onclick={() => void save()}>Save behavior</Button>{/snippet}
  {#snippet countsTag()}<span class="constraints-count">{counts}</span>{/snippet}
  <div class="behavior-page"
    ><div class="behavior-head"
      ><PageHeader
        title={operation.path}
        variant="mono"
        align="start"
        breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${svc.name} ${svc.version}`, to: `/services/${svc.id}` }, { label: crumb }]}
        {leading}
        {badge}
        description="Mock behavior: how Microcks picks a response for each incoming call, how long it waits, which parameters it checks and whether it keeps state. Try every change in the simulator before saving."
        descriptionTone="secondary"
        {actions}
      /><SummaryStrip
        role="note"
        aria-label="Saved behavior"
        parts={[
          { text: 'Saved', kind: 'label' },
          { text: current ? storedSummary(current) : '' },
          { text: `delay ${current?.delayMs} ms ${current?.delayStrategy ?? 'fixed'}`, sep: true },
          { text: `${current?.constraints.length} constraints`, sep: true },
          { text: `${exs.length} examples${inferred ? ' · dispatcher inferred from the OpenAPI path parameter' : ''}`, kind: 'label', sep: true },
        ]}
        >{#if savedAt}<span role="status" class="behavior-saved"><Icon name="check" size={14} />Behavior saved</span>{/if}</SummaryStrip
      ></div
    ><SplitPane class="behavior-layout" sideWidth="360px" sideMax="480px" mainWidth="600px" keepSideMax
      ><SplitPaneMain class="behavior-config"
        ><DispatcherPanel {draft} examples={exs} {pathParams} pathPrefix={operation.path.split('{')[0] ?? '/'} {edit} /><Panel
          padding="lg"
          title="Delay"
          id="sec-delay"
          class="delay"
          ><p class="panel-lead">Simulates the dependency's response time. Applies to every call unless the caller overrides it.</p
          ><div class="delay-row"
            ><label for="delay-range" class="field-inline-label">Default delay</label
            ><input
              id="delay-range"
              class="delay-range"
              type="range"
              min="0"
              max="2000"
              step="50"
              value={draft.delayMs}
              oninput={(e) => edit({ delayMs: Number(e.currentTarget.value) })}
            /><span class="delay-ms"
              ><input
                class="delay-number"
                type="number"
                min="0"
                step="50"
                aria-label="Default delay in milliseconds"
                value={draft.delayMs}
                oninput={(e) => edit({ delayMs: Math.max(0, parseInt(e.currentTarget.value, 10) || 0) })}
              /><span aria-hidden="true">ms</span></span
            ></div
          ><div class="delay-presets" role="group" aria-labelledby="delay-presets"
            ><span id="delay-presets" class="delay-presets-label">Presets</span
            >{#each DELAY_PRESETS as v (v)}<button type="button" class="mono-chip" aria-pressed={draft.delayMs === v} onclick={() => edit({ delayMs: v })}
                >{v}<!----> ms</button
              >{/each}</div
          ><div class="delay-strategy"
            ><span class="field-inline-label" aria-hidden="true">Strategy</span
            ><Segmented
              variant="joined"
              size="sm"
              label="Strategy"
              value={draft.delayStrategy ?? 'fixed'}
              onchange={(id) => edit({ delayStrategy: id as 'fixed' | 'random' })}
              options={[{ id: 'fixed', label: 'fixed' }, { id: 'random', label: 'random' }]}
            /><span class="delay-help">{delayHelp(draft)}</span></div
          ><p class="delay-overrides"
            ><span>Per endpoint: <code>?delay=500</code></span
            ><span>Per request: <code>x-microcks-delay: 800</code> header, wins over all others</span></p
          ></Panel
        ><Panel padding="lg" title="Parameter constraints" id="sec-constraints" class="constraints" actions={countsTag}
          ><p class="panel-lead">Expectations the contract cannot express. A violated constraint returns 400 before dispatching.</p
          ><div class="constraints-frame"
            ><table class="constraints-table" aria-label="Parameter constraints"
              ><thead
                ><tr
                  ><th scope="col">In</th><th scope="col">Name</th><th scope="col" class="is-center">Required</th><th scope="col" class="is-center"
                    >Recopy</th
                  ><th scope="col">Must match regexp</th><th scope="col"><span class="sr-only">Remove</span></th></tr
                ></thead
              ><tbody
                >{#each draft.constraints as c, i (i)}{@const invalid = Boolean(c.mustMatchRegexp) && !isValidRegExp(c.mustMatchRegexp ?? '')}{@const who =
                    c.name || `constraint ${i + 1}`}<tr
                    ><td
                      ><select
                        class="cell-control"
                        aria-label={`Location of ${who}`}
                        value={c.in}
                        onchange={(e) => setConstraint(i, { in: e.currentTarget.value as ParameterConstraint['in'] })}
                        ><option value="header">header</option><option value="query">query</option></select
                      ></td
                    ><td
                      ><input
                        class="cell-control"
                        type="text"
                        aria-label={`Name of ${who}`}
                        placeholder="parameter name"
                        value={c.name}
                        oninput={(e) => setConstraint(i, { name: e.currentTarget.value })}
                      /></td
                    ><td class="is-center"
                      ><input
                        type="checkbox"
                        class="checkbox constraint-check"
                        aria-label={`${who} is required`}
                        checked={c.required}
                        onchange={(e) => setConstraint(i, { required: e.currentTarget.checked })}
                      /></td
                    ><td class="is-center"
                      ><input
                        type="checkbox"
                        class="checkbox constraint-check"
                        aria-label={`Recopy ${who}`}
                        checked={Boolean(c.recopy)}
                        onchange={(e) => setConstraint(i, { recopy: e.currentTarget.checked })}
                      /></td
                    ><td
                      ><input
                        class="cell-control cell-regexp"
                        type="text"
                        aria-label={`Regular expression for ${who}`}
                        placeholder="no pattern"
                        aria-invalid={invalid || undefined}
                        aria-describedby={invalid ? `regexp-error-${i}` : undefined}
                        value={c.mustMatchRegexp ?? ''}
                        oninput={(e) => setConstraint(i, { mustMatchRegexp: e.currentTarget.value || undefined })}
                      />{#if invalid}<span id={`regexp-error-${i}`} class="cell-error">Invalid regular expression</span>{/if}</td
                    ><td
                      ><button
                        type="button"
                        class="cell-remove"
                        aria-label={`Remove ${who}`}
                        onclick={() => edit({ constraints: draft.constraints.filter((_, j) => j !== i) })}><Icon name="trash" size={15} /></button
                      ></td
                    ></tr
                  >{/each}{#if draft.constraints.length === 0}<tr
                    ><td colspan="6" class="constraints-empty">No constraint: every header and query value is accepted.</td></tr
                  >{/if}</tbody
              ></table
            ></div
          ><div class="constraints-foot"
            ><Button
              size="sm"
              variant="secondary"
              icon="plus"
              onclick={() => edit({ constraints: [...draft.constraints, { in: 'header', name: '', required: false, recopy: false } as unknown as ParameterConstraint] })}
              >Add constraint</Button
            ><span class="constraints-hint"><code>recopy</code> echoes the value in a response header, e.g. a correlation id.</span></div
          ></Panel
        ><Panel padding="lg" id="sec-stateful" class="stateful" aria-labelledby="stateful-title" data-on={draft.stateful || undefined}
          ><div class="stateful-head"
            ><div class="stateful-text"
              ><h2 id="stateful-title" class="panel-title">Stateful mock</h2
              ><span id="stateful-desc" class="stateful-desc">Persist state between calls, e.g. count views, keep a cart, reflect a PATCH in later GETs.</span
              ></div
            ><label class="stateful-switch"
              ><input
                type="checkbox"
                role="switch"
                class="switch"
                data-size="lg"
                aria-labelledby="stateful-title"
                aria-describedby="stateful-desc"
                checked={draft.stateful}
                onchange={(e) => toggleStateful(e.currentTarget.checked)}
              /><span aria-hidden="true">{draft.stateful ? 'On' : 'Off'}</span></label
            ></div
          ><ul class="stateful-cards"
            ><li
              ><span class="stateful-card-title">Runs in a SCRIPT dispatcher</span
              ><span>Turning it on switches the dispatcher to SCRIPT and loads a sample that reads and writes the <code>store</code>.</span></li
            ><li
              ><span class="stateful-card-title">Scoped to <!---->{svc.name}<!---->{' '}<!---->{svc.version}</span
              ><span>The key/value store is shared by its <!---->{svc.operationCount}<!----> operations, never by other APIs.</span></li
            ><li
              ><span class="stateful-card-title">Values expire</span
              ><span>Default time-to-live is 10 s; set another with <code>store.put(key, value, ttl)</code>.</span></li
            ></ul
          >{#if switched && draft.stateful}<p role="status" class="stateful-note"
              ><Icon name="info" size={14} />Dispatcher switched to SCRIPT with a view-counter sample. Responses can read <code>{'{{ views }}'}</code> from the request context.</p
            >{/if}</Panel
        ></SplitPaneMain
      ><SplitPaneSide
        ><SimulatorPanel {serviceId} {operationId} method={operation.method} protocol={svc.protocol} mockBase={mockBaseOf(svc)} {draft} /></SplitPaneSide
      ></SplitPane
    ></div
  >{/if}
