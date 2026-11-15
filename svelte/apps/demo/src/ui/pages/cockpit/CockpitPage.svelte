<script lang="ts">
  import '@microcks/demo-styles/pages/explore-kit/explore.css';
  import '@microcks/demo-styles/pages/cockpit/cockpit.css';
  import type { Protocol } from '@microcks/demo-core/domain/shared';
  import type { TraceCall } from '@microcks/demo-core/domain/observe';
  import { ApiBadge, Button, Callout, Chip, ConformanceBand, Icon, LiveIndicator, SplitPane, SplitPaneMain, StatCard, StatGrid } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useAnnounce, usePageTitle, useQuery, useRelativeTime, useSubscription, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { PROTOCOL_ORDER, fmt, operationUnit, pluralize, testRunHref } from '@/ui/app/format';
  import { serviceOutcomes } from '@/ui/app/outcomes';
  import { buildAttention } from './attention';
  import { HOURS, PROTOCOL_ATTR, START_STEPS, TONE, headerDate, isLive, level, runCounts, runDetail, traceStatus, usageText } from './overview';

  /** `/`: the cockpit. Key figures, the API wall, what needs attention, recent tests, top mocks and live traces. */
  usePageTitle('Cockpit · Microcks');
  const uc = useUseCases();
  const relative = useRelativeTime();
  const announce = useAnnounce();
  const cockpit = useQuery(() => uc.observe.getCockpit(), () => [uc]);
  const importers = useQuery(() => uc.importing.listImporters(), () => [uc]);
  let protos = $state.raw<Set<Protocol>>(new Set());
  let empty = $state(false);
  let done = $state.raw<Record<string, boolean>>({});
  const ticker = useSubscription<TraceCall, TraceCall[]>((l) => uc.observe.subscribeTraffic(l), () => [uc], {
    initial: [],
    reduce: (cur, call) => [call, ...cur].slice(0, 5),
  });

  const toggleProto = (p: Protocol) => {
    const next = new Set(protos);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    protos = next;
  };

  const toggleEmpty = () => {
    const showing = !empty;
    empty = showing;
    announce(showing ? 'Showing a fresh install with nothing imported.' : 'Back to the running instance.');
  };

  const togglePause = () => {
    const wasPaused = ticker.paused;
    ticker.toggle();
    announce(wasPaused ? 'Live traces resumed.' : 'Live traces paused.');
  };

  const hMax = Math.max(...HOURS);
  const data = $derived(cockpit.data);
  const services = $derived(empty || !data ? [] : data.services);
  const live = $derived(services.filter(isLive));
  const attention = $derived(empty || !data ? [] : buildAttention(data.services, importers.data ?? []));
  const tested = $derived(services.filter((s) => s.conformance !== null));
  const avg = $derived(tested.length ? Math.round(tested.reduce((n, s) => n + (s.conformance ?? 0), 0) / tested.length) : null);
  const syncCalls = $derived(services.filter((s) => s.protocol !== 'EVENT').reduce((n, s) => n + s.calls24h, 0));
  const msgs = $derived(services.filter((s) => s.protocol === 'EVENT').reduce((n, s) => n + s.calls24h, 0));
  const byId = $derived(new Map((data?.services ?? []).map((s) => [s.id, s])));
  const top = $derived(services.filter((s) => s.protocol !== 'EVENT').sort((a, b) => b.calls24h - a.calls24h).slice(0, 5));
  const tMax = $derived(top[0]?.calls24h ?? 1);
  const active = $derived([...protos]);
  const groups = $derived(
    PROTOCOL_ORDER.filter((p) => active.length === 0 || protos.has(p)).map((p) => ({ p, list: services.filter((s) => s.protocol === p).sort((a, b) => b.calls24h - a.calls24h) })),
  );
  const shown = $derived(groups.reduce((n, g) => n + g.list.length, 0));
  const stepsDone = $derived(START_STEPS.filter((s) => done[s.id]).length);
  const firstOpen = $derived(START_STEPS.findIndex((s) => !done[s.id]));
  const tests = $derived(empty || !data ? [] : data.recentTests);
  const calls = $derived(
    data ? [...ticker.value, ...data.recentCalls.filter((c) => !ticker.value.some((t) => t.callId === c.callId))].slice(0, 5) : [],
  );
  const passedRuns = $derived(empty || !data ? 0 : data.kpis.tests7d.passed);
  const failedRuns = $derived(empty || !data ? 0 : data.kpis.tests7d.failed);
</script>

{#snippet actions()}<Button variant="dashed" icon="window" aria-pressed={empty} onclick={toggleEmpty}
    >{empty ? 'Back to running instance' : 'Show empty install'}</Button
  ><ButtonRouterLink variant="secondary" icon="download" to="/sources/new">Import a contract</ButtonRouterLink
  ><ButtonRouterLink variant="primary" icon="play" to="/tests/create">Run a test</ButtonRouterLink
>{/snippet}

{#snippet catalogueLink()}<RouterLink to="/services">Catalogue</RouterLink>{/snippet}
{#snippet liveInline()}<LiveIndicator variant="inline" />{/snippet}
{#snippet historyLink()}<RouterLink to="/tests/service/pastry2">History</RouterLink>{/snippet}
{#snippet detailsLink()}<RouterLink to="/usage">Details</RouterLink>{/snippet}

{#if cockpit.status === 'error' && !cockpit.data}<PageHeader title="Cockpit" {actions} /><ErrorBlock
    error={cockpit.error}
    what="The cockpit"
    onretry={cockpit.reload}
  />{:else if !data}<PageHeader title="Cockpit" /><LoadingBlock label="the cockpit" />{:else}
  {#snippet description()}<span class="demo-mono">microcks.local:8080</span> · <!---->{headerDate(data.asOf)}<!----> ·<!---->{' '}<!---->{empty
      ? 'fresh install, nothing imported yet'
      : `${live.length} mocks live, ${attention.length} items need attention`}{/snippet}
  <div class="cockpit"
    ><PageHeader title="Cockpit" size="lg" {description} {actions} /><StatGrid label="Key figures" class="cockpit-stats"
      ><StatCard
        title="APIs & services"
        action={catalogueLink}
        value={String(services.length)}
        unit={empty ? 'no contract imported yet' : `${services.reduce((n, s) => n + s.operationCount, 0)} operations`}
        ><ul class="kpi-protocols" aria-label="Services per protocol"
          >{#each PROTOCOL_ORDER as p (p)}<li><ApiBadge protocol={p} name={String(services.filter((s) => s.protocol === p).length)} size="sm" /></li>{/each}</ul
        ></StatCard
      ><StatCard title="Mock invocations today" action={empty ? undefined : liveInline} value={fmt(syncCalls)} unit="requests"
        ><div
          class="kpi-bars"
          role="img"
          aria-label={empty ? 'No mock invocation yet today' : `Mock requests per hour today, 00 h to 11 h: ${HOURS.join(', ')}`}
          >{#each { length: 24 }, h (h)}{@const v = empty ? 0 : (HOURS[h] ?? 0)}{@const future = h >= HOURS.length}<span
              data-future={future ? '' : undefined}
              data-current={h === HOURS.length - 1 ? '' : undefined}
              style:height={future ? '2px' : `${Math.max(2, Math.round((v / hMax) * 100))}%`}
            ></span>{/each}</div
        ><span class="cockpit-stat-foot"
          >{empty ? 'Mocks appear as soon as a contract is imported.' : `${fmt(msgs)} async messages published · last request 12 s ago`}</span
        ></StatCard
      ><StatCard title="Tests · last 7 days" action={historyLink} value={String(passedRuns + failedRuns)} unit="runs"
        ><div class="kpi-meter" role="img" aria-label={empty ? 'No test run yet' : `${passedRuns} passed, ${failedRuns} failed over the last 7 days`}
          ><span style:flex={`${passedRuns} 1 0`} style:background="var(--success)"></span><span
            style:flex={`${failedRuns} 1 0`}
            style:background="var(--danger)"
          ></span></div
        ><div class="kpi-counts"
          ><span class="tone-success"><Icon name="check-circle" size={14} stroke-width={2.2} /> <!---->{passedRuns}<!----> passed</span
          ><span class="tone-danger"><Icon name="x-circle" size={14} stroke-width={2.2} /> <!---->{failedRuns}<!----> failed</span></div
        ><span class="kpi-workflows"
          ><RouterLink to="/workflows"><Icon name="dispatcher" size={12} />Workflows <!---->{empty ? 0 : 5}</RouterLink><span
            class={empty ? undefined : 'tone-danger'}>{empty ? '· no Arazzo document imported' : '· 1 failing'}</span
          ></span
        ></StatCard
      ><StatCard
        title="Average conformance"
        action={detailsLink}
        value={avg === null ? '—' : `${avg}%`}
        unit={avg === null ? 'no test yet' : 'current score'}
        tone={TONE[level(avg)]}
        data-empty={avg === null ? '' : undefined}
        ><div class="kpi-gauge" data-level={level(avg)} aria-hidden="true"><span style:width={`${avg ?? 0}%`}></span></div
        ><span class="cockpit-stat-foot"
          >{avg === null
            ? 'Run a first test to get a conformance score.'
            : `Across ${tested.length} tested services · ${services.length - tested.length} never tested`}</span
        ></StatCard
      ></StatGrid
    >{#if empty}<section aria-labelledby="start-title" class="start"
        ><SplitPane mainWidth="460px"
          ><SplitPaneMain class="start-main"
            ><div class="start-intro"
              ><div class="start-heading"
                ><h2 id="start-title" class="start-title">Getting started</h2><span class="start-progress">{stepsDone}<!----> of 3 done</span></div
              ><p class="start-lead">This Microcks instance has no API yet. Three steps take you from a contract to a live mock and a conformance proof.</p></div
            ><ol class="start-steps"
              >{#each START_STEPS as step, i (step.id)}{@const isDone = Boolean(done[step.id])}{@const current = i === firstOpen}<li
                  class="start-step"
                  data-current={current ? '' : undefined}
                  data-done={isDone ? '' : undefined}
                  ><button
                    type="button"
                    class="start-step-toggle"
                    aria-pressed={isDone}
                    aria-label={`Mark step ${i + 1} as ${isDone ? 'not done' : 'done'}`}
                    onclick={() => (done = { ...done, [step.id]: !isDone })}
                    >{#if isDone}<Icon name="check" size={14} stroke-width={2.6} />{:else}{i + 1}{/if}</button
                  ><div class="start-step-text"
                    ><span class="start-step-title">{step.title}</span><span class="start-step-desc">{step.desc}</span
                    >{#if step.code}<pre class="start-step-code">{step.code}</pre>{/if}</div
                  ><RouterLink class="start-step-cta" to={step.to}>{step.cta}</RouterLink></li
                >{/each}</ol
            ></SplitPaneMain
          ><aside aria-labelledby="start-other-title" class="start-other"
            ><h3 id="start-other-title" class="start-other-title">Other ways to start</h3><RouterLink to="/hub" class="start-other-link"
              ><span class="start-other-name">Browse the Hub</span><span class="start-other-desc"
                >Install a ready-made API from the community catalogue.</span
              ></RouterLink
            ><div aria-hidden="true" class="start-other-rule"></div><RouterLink to="/sources" class="start-other-link"
              ><span class="start-other-name">Connect a Git repository</span><span class="start-other-desc"
                >A scheduled Importer keeps mocks in sync with your contracts.</span
              ></RouterLink
            ><div aria-hidden="true" class="start-other-rule"></div><a
              href="https://microcks.io/documentation/tutorials/getting-started/"
              target="_blank"
              rel="noreferrer"
              class="start-other-link"
              ><span class="start-other-name">Read the getting-started tutorial</span><span class="start-other-desc"
                >microcks.io documentation, opens in a new tab.</span
              ></a
            ></aside
          ></SplitPane
        ></section
      >{:else}<section aria-labelledby="wall-title" class="wall"
        ><div class="wall-head"
          ><div class="wall-heading"
            ><h2 id="wall-title" class="wall-title">API wall</h2><span class="wall-count" role="status"
              >{active.length ? `${shown} of ${services.length} services` : `${services.length} services`}<!----> · <!---->{live.length}<!----> live now</span
            ></div
          ><div class="wall-filters" role="group" aria-label="Filter by protocol"
            >{#each PROTOCOL_ORDER as p (p)}<Chip
                protocol={p}
                count={services.filter((s) => s.protocol === p).length}
                pressed={protos.has(p)}
                onclick={() => toggleProto(p)}>{p}</Chip
              >{/each}{#if active.length}<button type="button" class="wall-show-all" onclick={() => (protos = new Set())}>Show all</button
              >{/if}</div
          ></div
        ><div class="wall-groups"
          >{#each groups.filter((g) => g.list.length) as { p, list } (p)}<section
              aria-label={`${p} services, ${list.length}`}
              class="wall-group"
              data-protocol={PROTOCOL_ATTR[p]}
              style:flex={`${list.length} 1 ${list.length * 232}px`}
              ><div class="wall-group-head" aria-hidden="true"
                ><span class="wall-swatch"></span>{p}<span class="wall-group-count">{list.length}</span></div
              ><div class="wall-tiles"
                >{#each list as s (s.id)}<RouterLink class="wall-tile" data-live={isLive(s) ? '' : undefined} to={`/services/${s.id}`}
                    ><span class="wall-tile-head"
                      ><ApiBadge protocol={s.protocol} name={s.name} version={s.version} class="wall-tile-badge" />{#if isLive(s)}<LiveIndicator
                          variant="inline"
                          class="wall-tile-live"
                        />{/if}</span
                    ><span class="wall-tile-score"
                      ><ConformanceBand size="mini" outcomes={serviceOutcomes(s)} unit={operationUnit(s.protocol)} /><span
                        class="wall-tile-pct"
                        data-level={level(s.conformance)}>{s.conformance === null ? 'untested' : `${s.conformance}%`}</span
                      ></span
                    ><span class="wall-tile-usage">{usageText(s)}</span></RouterLink
                  >{/each}</div
              ></section
            >{/each}</div
        ><ul class="wall-legend" aria-label="Legend"
          ><li><span aria-hidden="true" class="wall-legend-swatch" data-kind="pass"></span>operation conformant</li><li
            ><span aria-hidden="true" class="wall-legend-swatch" data-kind="fail"></span>operation failing</li
          ><li><span aria-hidden="true" class="wall-legend-swatch" data-kind="untested"></span>never tested</li><li
            ><span aria-hidden="true" class="wall-legend-swatch" data-kind="live"></span>mock called or publishing in the last minute</li
          ></ul
        ></section
      ><div class="cockpit-panels"
        ><section aria-labelledby="attn-title" class="cockpit-panel"
          ><div class="cockpit-panel-head"
            ><h2 id="attn-title" class="cockpit-panel-title">Needs attention</h2><span class="cockpit-panel-meta"
              >{pluralize(attention.length, 'item')}</span
            ></div
          >{#if attention.length === 0}<p class="cockpit-panel-empty">Nothing needs your attention.</p>{/if}{#each attention as a (a.id)}<div
              class="attn"
              data-tone={a.tone}
              ><Icon class="attn-icon" name={a.tone === 'danger' ? 'x-circle' : a.tone === 'warning' ? 'warning' : 'never-tested'} size={18} /><div
                class="attn-text"
                ><span class="attn-kind-row"
                  ><span class="attn-kind">{a.kind}</span>{#if a.badge === 'ARAZZO'}<ApiBadge arazzo name={a.subject} size="sm" />{:else if a.badge === 'importer'}<ApiBadge
                      label="importer"
                      value={a.subject}
                      size="sm"
                    />{:else}<ApiBadge protocol={a.badge} name={a.subject} size="sm" />{/if}</span
                ><span class="attn-title">{a.title}</span><span class="attn-detail">{a.detail}</span></div
              ><RouterLink class="attn-cta" to={a.to}>{a.cta}<Icon name="chevron" size={13} /></RouterLink></div
            >{/each}</section
        ><section aria-labelledby="tests-title" class="cockpit-panel" data-gap="tight"
          ><div class="cockpit-panel-head" data-pad=""
            ><h2 id="tests-title" class="cockpit-panel-title">Recent tests</h2><RouterLink class="cockpit-panel-link" to="/tests/service/pastry2"
              >All tests</RouterLink
            ></div
          >{#each tests as r (r.id)}{@const svc = byId.get(r.serviceId)}{@const ok = r.result === 'passed'}{@const counts = runCounts(r)}<RouterLink
              to={testRunHref(r)}
              class="recent-test"
              data-ok={ok ? '' : undefined}
              ><span class="recent-test-result"
                ><Icon name={ok ? 'check-circle' : 'x-circle'} size={15} stroke-width={2.2} />{ok ? 'Passed' : 'Failed'}</span
              ><span class="recent-test-what"
                >{#if svc}<ApiBadge protocol={svc.protocol} name={`${svc.name} ${svc.version}`} size="sm" />{/if}<span class="recent-test-runner"
                  >{[`#${r.id}`, r.runner, runDetail(r)].filter(Boolean).join(' · ')}</span
                ></span
              ><span class="recent-test-figures"
                >{#if counts}<span>{counts}</span>{/if}<span class="recent-test-when">{relative(r.startedAt)}</span></span
              ></RouterLink
            >{/each}</section
        ><section aria-labelledby="top-title" class="cockpit-panel"
          ><div class="cockpit-panel-head"
            ><h2 id="top-title" class="cockpit-panel-title">Most called mocks today</h2><span class="cockpit-panel-meta">requests</span></div
          ><ol class="top-list"
            >{#each top as s, i (s.id)}<li
                ><RouterLink to={`/services/${s.id}`} class="top-row" data-protocol={PROTOCOL_ATTR[s.protocol]}
                  ><span class="top-row-line"
                    ><span class="top-rank">{i + 1}</span><span class="top-name"
                      ><span class="top-proto">{s.protocol}</span><span class="top-label"
                        >{s.name}<!---->{' '}<span class="top-version">{s.version}</span></span
                      >{#if isLive(s)}<LiveIndicator variant="dot" size="sm" aria-label="live" role="img" />{/if}</span
                    ><span class="top-count">{fmt(s.calls24h)}</span></span
                  ><span class="top-bar" aria-hidden="true"
                    ><span data-first={i === 0 ? '' : undefined} style:width={`${Math.max(2, Math.round((s.calls24h / tMax) * 100))}%`}
                    ></span></span
                  ></RouterLink
                ></li
              >{/each}</ol
          ><div class="cockpit-panel-foot"
            ><span>Event APIs publish on their own schedule and are counted apart.</span><RouterLink to="/usage"
              >Usage &amp; conformance<Icon name="chevron" size={13} /></RouterLink
            ></div
          ></section
        ><section aria-labelledby="traces-title" class="cockpit-panel"
          ><div class="cockpit-panel-head" data-align="center"
            ><div class="cockpit-panel-heading"
              ><h2 id="traces-title" class="cockpit-panel-title">Live traces</h2><LiveIndicator size="sm" paused={ticker.paused} /></div
            ><button type="button" class="traces-pause" aria-pressed={ticker.paused} onclick={togglePause}
              >{ticker.paused ? 'Resume' : 'Pause'}</button
            ></div
          ><div role="log" aria-live="off" aria-label="Latest mock calls" class="trace-log"
            >{#each calls as t, i (t.callId)}<div class="trace-row" data-new={i === 0 && !ticker.paused ? '' : undefined}
                ><span class="trace-time">{t.at.slice(11, 19)}</span><span class="trace-verb" data-protocol={PROTOCOL_ATTR[t.protocol]}
                  >{t.protocol === 'EVENT' ? 'PUBLISH' : t.method}</span
                ><span class="trace-path">{t.protocol === 'EVENT' ? `kafka · ${t.path}` : t.path}</span><span
                  class="trace-status"
                  data-ok={t.status < 400 ? '' : undefined}>{traceStatus(t)}</span
                ></div
              >{/each}</div
          ><div class="cockpit-panel-foot"
            ><span>Requests and responses as the mocks serve them, with the dispatcher's decision.</span><RouterLink to="/traces"
              >Open live traces<Icon name="chevron" size={13} /></RouterLink
            ></div
          ></section
        ></div
      >{/if}{#if cockpit.status === 'error'}<Callout tone="danger" live="assertive">The cockpit could not be refreshed.</Callout>{/if}</div
  >
{/if}
