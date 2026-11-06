import '../explore-kit/explore.css';
import './cockpit.css';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import type { OperationOutcome } from '@/domain/testing';
import type { Protocol, ServiceSummary } from '@/domain/shared';
import type { TraceCall } from '@/domain/observe';
import { PageHeader, useAnnounce, useQuery, useRelativeTime, useSubscription, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { ConformanceBand, type OperationResult } from '@/ui/components/ui/conformance-band';
import { Icon } from '@/ui/components/ui/icon';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { SplitPane, SplitPaneMain } from '@/ui/components/ui/split-pane';
import { StatCard, StatGrid } from '@/ui/components/ui/stat-card';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { PROTOCOL_ORDER, fmt, operationUnit, pluralize, testRunHref } from '@/ui/app/format';
import { buildAttention } from './attention';

const HOURS = [5, 1, 2, 1, 1, 6, 15, 40, 92, 121, 165, 125];
const START_STEPS = [
  { id: 'import', title: 'Import a contract', desc: 'OpenAPI, AsyncAPI, gRPC Protobuf, GraphQL schema, Postman collection or SoapUI project. Drop a file or point to a Git URL.', cta: 'Import a contract', to: '/sources/new' },
  { id: 'call', title: 'Call the mock', desc: 'Every operation is served right after the import, at a URL derived from the service name and version.', code: 'curl http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille', cta: 'Browse APIs', to: '/services' },
  { id: 'test', title: 'Run a conformance test', desc: 'Point Microcks at your implementation. It replays the examples and checks responses against the contract.', cta: 'Run a test', to: '/tests/create' },
];

const toOutcomes = (s: ServiceSummary): OperationResult[] =>
  s.lastResults ? s.lastResults.map((r) => (r === 'pass' ? 'pass' : 'fail')) : Array.from({ length: s.operationCount }, () => 'untested');

/** Conformance level, same thresholds as the prototype: 80 and 50. */
const level = (c: number | null) => (c === null ? 'none' : c >= 80 ? 'high' : c >= 50 ? 'mid' : 'low');

const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };

const TONE = { high: 'success', mid: 'warning', low: 'danger', none: 'neutral' } as const;

const isLive = (s: ServiceSummary) => s.id === 'pastry2' || s.protocol === 'EVENT';

function usageText(s: ServiceSummary) {
  const unit = s.protocol === 'EVENT' ? 'msg' : 'req';
  return `${pluralize(s.operationCount, operationUnit(s.protocol))} · ${fmt(s.calls24h)} ${unit} today${isLive(s) ? (s.protocol === 'EVENT' ? ' · publishing on Kafka' : ' · called 12 s ago') : ''}`;
}

const runCounts = (r: { operations?: OperationOutcome[]; runner: string; passed: number; total: number }) =>
  r.runner === 'A2A_CONFORMANCE' ? `${r.passed}/${r.total} checks` : r.operations ? `${r.operations.filter((o) => o === 'pass').length}/${r.operations.length} ops` : '';

/** "Tuesday, Nov 3, 2026 · 09:10": the demo clock, in UTC like the trace times. */
const headerDate = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${day} · ${iso.slice(11, 16)}`;
};

/** Status column of the ticker: messages for events, OK for gRPC, the HTTP code otherwise. */
const traceStatus = (t: TraceCall) =>
  t.protocol === 'EVENT' ? '1 msg' : `${t.protocol === 'gRPC' && t.status < 400 ? 'OK' : t.status} · ${t.ms} ms`;

/** Third part of the runner line: the transports of an agent test, the broker of an event test. */
const runDetail = (r: { runner: string; endpoint: string }) =>
  r.runner === 'A2A_CONFORMANCE' ? '3 transports' : r.endpoint.startsWith('kafka') ? 'Kafka' : '';

export default function CockpitPage() {
  usePageTitle('Cockpit · Microcks');
  const uc = useUseCases();
  const relative = useRelativeTime();
  const announce = useAnnounce();
  const cockpit = useQuery(() => uc.observe.getCockpit(), [uc]);
  const importers = useQuery(() => uc.importing.listImporters(), [uc]);
  const [protos, setProtos] = useState<Set<Protocol>>(new Set());
  const [empty, setEmpty] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const ticker = useSubscription<TraceCall, TraceCall[]>((l) => uc.observe.subscribeTraffic(l), [uc], {
    initial: [],
    reduce: (cur, call) => [call, ...cur].slice(0, 5),
  });

  const toggleProto = (p: Protocol) =>
    setProtos((cur) => {
      const next = new Set(cur);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  const actions = (
    <>
      <Button
        variant="dashed"
        icon="window"
        aria-pressed={empty}
        onClick={() => {
          setEmpty(!empty);
          announce(!empty ? 'Showing a fresh install with nothing imported.' : 'Back to the running instance.');
        }}
      >
        {empty ? 'Back to running instance' : 'Show empty install'}
      </Button>
      <Button asChild variant="secondary" icon="download">
        <RouterLink to="/sources/new">Import a contract</RouterLink>
      </Button>
      <Button asChild variant="primary" icon="play">
        <RouterLink to="/tests/create">Run a test</RouterLink>
      </Button>
    </>
  );

  if (cockpit.status === 'error' && !cockpit.data) {
    return (
      <>
        <PageHeader title="Cockpit" actions={actions} />
        <ErrorBlock error={cockpit.error} what="The cockpit" onRetry={cockpit.reload} />
      </>
    );
  }
  const data = cockpit.data;
  if (!data) {
    return (
      <>
        <PageHeader title="Cockpit" />
        <LoadingBlock label="the cockpit" />
      </>
    );
  }

  const services = empty ? [] : data.services;
  const live = services.filter(isLive);
  const attention = empty ? [] : buildAttention(data.services, importers.data ?? []);
  const tested = services.filter((s) => s.conformance !== null);
  const avg = tested.length ? Math.round(tested.reduce((n, s) => n + (s.conformance ?? 0), 0) / tested.length) : null;
  const syncCalls = services.filter((s) => s.protocol !== 'EVENT').reduce((n, s) => n + s.calls24h, 0);
  const msgs = services.filter((s) => s.protocol === 'EVENT').reduce((n, s) => n + s.calls24h, 0);
  const hMax = Math.max(...HOURS);
  const byId = new Map(data.services.map((s) => [s.id, s]));
  const top = services.filter((s) => s.protocol !== 'EVENT').sort((a, b) => b.calls24h - a.calls24h).slice(0, 5);
  const tMax = top[0]?.calls24h ?? 1;
  const active = [...protos];
  const groups = PROTOCOL_ORDER.filter((p) => active.length === 0 || protos.has(p)).map((p) => ({ p, list: services.filter((s) => s.protocol === p).sort((a, b) => b.calls24h - a.calls24h) }));
  const shown = groups.reduce((n, g) => n + g.list.length, 0);
  const stepsDone = START_STEPS.filter((s) => done[s.id]).length;
  const firstOpen = START_STEPS.findIndex((s) => !done[s.id]);
  const tests = empty ? [] : data.recentTests;
  const calls = [...ticker.value, ...data.recentCalls.filter((c) => !ticker.value.some((t) => t.callId === c.callId))].slice(0, 5);
  const passedRuns = empty ? 0 : data.kpis.tests7d.passed;
  const failedRuns = empty ? 0 : data.kpis.tests7d.failed;

  return (
    <div className="cockpit">
      <PageHeader
        title="Cockpit"
        size="lg"
        description={
          <>
            <span className="demo-mono">microcks.local:8080</span> · {headerDate(data.asOf)} ·{' '}
            {empty ? 'fresh install, nothing imported yet' : `${live.length} mocks live, ${attention.length} items need attention`}
          </>
        }
        actions={actions}
      />

      <StatGrid label="Key figures" className="cockpit-stats">
        <StatCard
          title="APIs & services"
          action={<RouterLink to="/services">Catalogue</RouterLink>}
          value={services.length}
          unit={empty ? 'no contract imported yet' : `${services.reduce((n, s) => n + s.operationCount, 0)} operations`}
        >
          <ul className="kpi-protocols" aria-label="Services per protocol">
            {PROTOCOL_ORDER.map((p) => (
              <li key={p}>
                <ApiBadge protocol={p} name={String(services.filter((s) => s.protocol === p).length)} size="sm" />
              </li>
            ))}
          </ul>
        </StatCard>
        <StatCard title="Mock invocations today" action={empty ? undefined : <LiveIndicator variant="inline" />} value={fmt(syncCalls)} unit="requests">
          <div
            className="kpi-bars"
            role="img"
            aria-label={empty ? 'No mock invocation yet today' : `Mock requests per hour today, 00 h to 11 h: ${HOURS.join(', ')}`}
          >
            {Array.from({ length: 24 }, (_, h) => {
              const v = empty ? 0 : (HOURS[h] ?? 0);
              const future = h >= HOURS.length;
              return (
                <span
                  key={h}
                  data-future={future ? '' : undefined}
                  data-current={h === HOURS.length - 1 ? '' : undefined}
                  style={{ height: future ? '2px' : `${Math.max(2, Math.round((v / hMax) * 100))}%` }}
                />
              );
            })}
          </div>
          <span className="cockpit-stat-foot">
            {empty ? 'Mocks appear as soon as a contract is imported.' : `${fmt(msgs)} async messages published · last request 12 s ago`}
          </span>
        </StatCard>
        <StatCard title="Tests · last 7 days" action={<RouterLink to="/tests/service/pastry2">History</RouterLink>} value={passedRuns + failedRuns} unit="runs">
          <div className="kpi-meter" role="img" aria-label={empty ? 'No test run yet' : `${passedRuns} passed, ${failedRuns} failed over the last 7 days`}>
            <span style={{ flex: `${passedRuns} 1 0`, background: 'var(--success)' }} />
            <span style={{ flex: `${failedRuns} 1 0`, background: 'var(--danger)' }} />
          </div>
          <div className="kpi-counts">
            <span className="tone-success"><Icon name="check-circle" size={14} /> {passedRuns} passed</span>
            <span className="tone-danger"><Icon name="x-circle" size={14} /> {failedRuns} failed</span>
          </div>
          <span className="kpi-workflows">
            <RouterLink to="/workflows"><Icon name="dispatcher" size={12} />Workflows {empty ? 0 : 5}</RouterLink>
            <span className={empty ? undefined : 'tone-danger'}>{empty ? '· no Arazzo document imported' : '· 1 failing'}</span>
          </span>
        </StatCard>
        <StatCard
          title="Average conformance"
          action={<RouterLink to="/usage">Details</RouterLink>}
          value={avg === null ? '—' : `${avg}%`}
          unit={avg === null ? 'no test yet' : 'current score'}
          tone={TONE[level(avg)]}
          data-empty={avg === null ? '' : undefined}
        >
          <div className="kpi-gauge" data-level={level(avg)} aria-hidden="true">
            <span style={{ width: `${avg ?? 0}%` }} />
          </div>
          <span className="cockpit-stat-foot">
            {avg === null ? 'Run a first test to get a conformance score.' : `Across ${tested.length} tested services · ${services.length - tested.length} never tested`}
          </span>
        </StatCard>
      </StatGrid>

      {empty ? (
        <section aria-labelledby="start-title" className="start">
          <SplitPane mainWidth="460px">
            <SplitPaneMain className="start-main">
              <div className="start-intro">
                <div className="start-heading">
                  <h2 id="start-title" className="start-title">Getting started</h2>
                  <span className="start-progress">{stepsDone} of 3 done</span>
                </div>
                <p className="start-lead">This Microcks instance has no API yet. Three steps take you from a contract to a live mock and a conformance proof.</p>
              </div>
              <ol className="start-steps">
                {START_STEPS.map((step, i) => {
                  const isDone = Boolean(done[step.id]);
                  const current = i === firstOpen;
                  return (
                    <li key={step.id} className="start-step" data-current={current ? '' : undefined} data-done={isDone ? '' : undefined}>
                      <button
                        type="button"
                        className="start-step-toggle"
                        aria-pressed={isDone}
                        aria-label={`Mark step ${i + 1} as ${isDone ? 'not done' : 'done'}`}
                        onClick={() => setDone({ ...done, [step.id]: !isDone })}
                      >
                        {isDone ? <Icon name="check" size={14} /> : i + 1}
                      </button>
                      <div className="start-step-text">
                        <span className="start-step-title">{step.title}</span>
                        <span className="start-step-desc">{step.desc}</span>
                        {step.code ? <pre className="start-step-code">{step.code}</pre> : null}
                      </div>
                      <RouterLink className="start-step-cta" to={step.to}>{step.cta}</RouterLink>
                    </li>
                  );
                })}
              </ol>
            </SplitPaneMain>
            <aside aria-labelledby="start-other-title" className="start-other">
              <h3 id="start-other-title" className="start-other-title">Other ways to start</h3>
              <RouterLink to="/hub" className="start-other-link">
                <span className="start-other-name">Browse the Hub</span>
                <span className="start-other-desc">Install a ready-made API from the community catalogue.</span>
              </RouterLink>
              <div aria-hidden="true" className="start-other-rule" />
              <RouterLink to="/sources" className="start-other-link">
                <span className="start-other-name">Connect a Git repository</span>
                <span className="start-other-desc">A scheduled Importer keeps mocks in sync with your contracts.</span>
              </RouterLink>
              <div aria-hidden="true" className="start-other-rule" />
              <a href="https://microcks.io/documentation/tutorials/getting-started/" target="_blank" rel="noreferrer" className="start-other-link">
                <span className="start-other-name">Read the getting-started tutorial</span>
                <span className="start-other-desc">microcks.io documentation, opens in a new tab.</span>
              </a>
            </aside>
          </SplitPane>
        </section>
      ) : (
        <>
          <section aria-labelledby="wall-title" className="wall">
            <div className="wall-head">
              <div className="wall-heading">
                <h2 id="wall-title" className="wall-title">API wall</h2>
                <span className="wall-count" role="status">
                  {active.length ? `${shown} of ${services.length} services` : `${services.length} services`} · {live.length} live now
                </span>
              </div>
              <div className="wall-filters" role="group" aria-label="Filter by protocol">
                {PROTOCOL_ORDER.map((p) => (
                  <Chip key={p} protocol={p} count={services.filter((s) => s.protocol === p).length} pressed={protos.has(p)} onClick={() => toggleProto(p)}>
                    {p}
                  </Chip>
                ))}
                {active.length ? <button type="button" className="wall-show-all" onClick={() => setProtos(new Set())}>Show all</button> : null}
              </div>
            </div>
            <div className="wall-groups">
              {groups.filter((g) => g.list.length).map(({ p, list }) => (
                <section
                  key={p}
                  aria-label={`${p} services, ${list.length}`}
                  className="wall-group"
                  data-protocol={PROTOCOL_ATTR[p]}
                  style={{ flex: `${list.length} 1 ${list.length * 232}px` }}
                >
                  <div className="wall-group-head" aria-hidden="true">
                    <span className="wall-swatch" />
                    {p}
                    <span className="wall-group-count">{list.length}</span>
                  </div>
                  <div className="wall-tiles">
                    {list.map((s) => (
                      <RouterLink key={s.id} className="wall-tile" data-live={isLive(s) ? '' : undefined} to={`/services/${s.id}`}>
                        <span className="wall-tile-head">
                          <ApiBadge protocol={s.protocol} name={s.name} version={s.version} className="wall-tile-badge" />
                          {isLive(s) ? <LiveIndicator variant="inline" className="wall-tile-live" /> : null}
                        </span>
                        <span className="wall-tile-score">
                          <ConformanceBand size="mini" outcomes={toOutcomes(s)} unit={operationUnit(s.protocol)} />
                          <span className="wall-tile-pct" data-level={level(s.conformance)}>{s.conformance === null ? 'untested' : `${s.conformance}%`}</span>
                        </span>
                        <span className="wall-tile-usage">{usageText(s)}</span>
                      </RouterLink>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <ul className="wall-legend" aria-label="Legend">
              <li><span aria-hidden="true" className="wall-legend-swatch" data-kind="pass" />operation conformant</li>
              <li><span aria-hidden="true" className="wall-legend-swatch" data-kind="fail" />operation failing</li>
              <li><span aria-hidden="true" className="wall-legend-swatch" data-kind="untested" />never tested</li>
              <li><span aria-hidden="true" className="wall-legend-swatch" data-kind="live" />mock called or publishing in the last minute</li>
            </ul>
          </section>

          <div className="cockpit-panels">
            <section aria-labelledby="attn-title" className="cockpit-panel">
              <div className="cockpit-panel-head">
                <h2 id="attn-title" className="cockpit-panel-title">Needs attention</h2>
                <span className="cockpit-panel-meta">{pluralize(attention.length, 'item')}</span>
              </div>
              {attention.length === 0 ? <p className="cockpit-panel-empty">Nothing needs your attention.</p> : null}
              {attention.map((a) => (
                <div key={a.id} className="attn" data-tone={a.tone}>
                  <Icon className="attn-icon" name={a.tone === 'danger' ? 'x-circle' : a.tone === 'warning' ? 'warning' : 'never-tested'} size={18} />
                  <div className="attn-text">
                    <span className="attn-kind-row">
                      <span className="attn-kind">{a.kind}</span>
                      {a.badge === 'ARAZZO' ? (
                        <ApiBadge arazzo name={a.subject} size="sm" />
                      ) : a.badge === 'importer' ? (
                        <ApiBadge label="importer" value={a.subject} size="sm" />
                      ) : (
                        <ApiBadge protocol={a.badge} name={a.subject} size="sm" />
                      )}
                    </span>
                    <span className="attn-title">{a.title}</span>
                    <span className="attn-detail">{a.detail}</span>
                  </div>
                  <RouterLink className="attn-cta" to={a.to}>
                    {a.cta}
                    <Icon name="chevron" size={13} />
                  </RouterLink>
                </div>
              ))}
            </section>

            <section aria-labelledby="tests-title" className="cockpit-panel" data-gap="tight">
              <div className="cockpit-panel-head" data-pad="">
                <h2 id="tests-title" className="cockpit-panel-title">Recent tests</h2>
                <RouterLink className="cockpit-panel-link" to="/tests/service/pastry2">All tests</RouterLink>
              </div>
              {tests.map((r) => {
                const svc = byId.get(r.serviceId);
                const ok = r.result === 'passed';
                const counts = runCounts(r);
                return (
                  <RouterLink key={r.id} to={testRunHref(r)} className="recent-test" data-ok={ok ? '' : undefined}>
                    <span className="recent-test-result">
                      <Icon name={ok ? 'check-circle' : 'x-circle'} size={15} />
                      {ok ? 'Passed' : 'Failed'}
                    </span>
                    <span className="recent-test-what">
                      {svc ? <ApiBadge protocol={svc.protocol} name={`${svc.name} ${svc.version}`} size="sm" /> : null}
                      <span className="recent-test-runner">{[`#${r.id}`, r.runner, runDetail(r)].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="recent-test-figures">
                      {counts ? <span>{counts}</span> : null}
                      <span className="recent-test-when">{relative(r.startedAt)}</span>
                    </span>
                  </RouterLink>
                );
              })}
            </section>

            <section aria-labelledby="top-title" className="cockpit-panel">
              <div className="cockpit-panel-head">
                <h2 id="top-title" className="cockpit-panel-title">Most called mocks today</h2>
                <span className="cockpit-panel-meta">requests</span>
              </div>
              <ol className="top-list">
                {top.map((s, i) => (
                  <li key={s.id}>
                    <RouterLink to={`/services/${s.id}`} className="top-row" data-protocol={PROTOCOL_ATTR[s.protocol]}>
                      <span className="top-row-line">
                        <span className="top-rank">{i + 1}</span>
                        <span className="top-name">
                          <span className="top-proto">{s.protocol}</span>
                          <span className="top-label">{s.name} <span className="top-version">{s.version}</span></span>
                          {isLive(s) ? <LiveIndicator variant="dot" size="sm" aria-label="live" role="img" /> : null}
                        </span>
                        <span className="top-count">{fmt(s.calls24h)}</span>
                      </span>
                      <span className="top-bar" aria-hidden="true">
                        <span data-first={i === 0 ? '' : undefined} style={{ width: `${Math.max(2, Math.round((s.calls24h / tMax) * 100))}%` }} />
                      </span>
                    </RouterLink>
                  </li>
                ))}
              </ol>
              <div className="cockpit-panel-foot">
                <span>Event APIs publish on their own schedule and are counted apart.</span>
                <RouterLink to="/usage">Usage &amp; conformance<Icon name="chevron" size={13} /></RouterLink>
              </div>
            </section>

            <section aria-labelledby="traces-title" className="cockpit-panel">
              <div className="cockpit-panel-head" data-align="center">
                <div className="cockpit-panel-heading">
                  <h2 id="traces-title" className="cockpit-panel-title">Live traces</h2>
                  <LiveIndicator size="sm" paused={ticker.paused} />
                </div>
                <button
                  type="button"
                  className="traces-pause"
                  aria-pressed={ticker.paused}
                  onClick={() => {
                    ticker.toggle();
                    announce(ticker.paused ? 'Live traces resumed.' : 'Live traces paused.');
                  }}
                >
                  {ticker.paused ? 'Resume' : 'Pause'}
                </button>
              </div>
              <div role="log" aria-live="off" aria-label="Latest mock calls" className="trace-log">
                {calls.map((t, i) => (
                  <div key={t.callId} className="trace-row" data-new={i === 0 && !ticker.paused ? '' : undefined}>
                    <span className="trace-time">{t.at.slice(11, 19)}</span>
                    <span className="trace-verb" data-protocol={PROTOCOL_ATTR[t.protocol]}>{t.protocol === 'EVENT' ? 'PUBLISH' : t.method}</span>
                    <span className="trace-path">{t.protocol === 'EVENT' ? `kafka · ${t.path}` : t.path}</span>
                    <span className="trace-status" data-ok={t.status < 400 ? '' : undefined}>{traceStatus(t)}</span>
                  </div>
                ))}
              </div>
              <div className="cockpit-panel-foot">
                <span>Requests and responses as the mocks serve them, with the dispatcher&apos;s decision.</span>
                <RouterLink to="/traces">Open live traces<Icon name="chevron" size={13} /></RouterLink>
              </div>
            </section>
          </div>
        </>
      )}
      {cockpit.status === 'error' ? <Callout tone="danger" live="assertive">The cockpit could not be refreshed.</Callout> : null}
    </div>
  );
}
