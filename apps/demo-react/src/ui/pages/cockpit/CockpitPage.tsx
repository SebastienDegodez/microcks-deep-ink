import '../explore-kit/explore.css';
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
import { Panel } from '@/ui/components/ui/panel';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';
import { PROTOCOL_ORDER, fmt, pluralize } from '../explore-kit/format';
import { buildAttention } from './attention';

const HOURS = [5, 1, 2, 1, 1, 6, 15, 40, 92, 121, 165, 125];
const START_STEPS = [
  { id: 'import', title: 'Import a contract', desc: 'OpenAPI, AsyncAPI, gRPC Protobuf, GraphQL schema, Postman collection or SoapUI project. Drop a file or point to a Git URL.', cta: 'Import a contract', to: '/import' },
  { id: 'call', title: 'Call the mock', desc: 'Every operation is served right after the import, at a URL derived from the service name and version.', code: 'curl http://microcks.local:8080/rest/API+Pastry/2.0/pastries/Millefeuille', cta: 'Browse APIs', to: '/services' },
  { id: 'test', title: 'Run a conformance test', desc: 'Point Microcks at your implementation. It replays the examples and checks responses against the contract.', cta: 'Run a test', to: '/tests/create' },
];

const toOutcomes = (s: ServiceSummary): OperationResult[] =>
  s.lastResults ? s.lastResults.map((r) => (r === 'pass' ? 'pass' : 'fail')) : Array.from({ length: s.operationCount }, () => 'untested');

const isLive = (s: ServiceSummary) => s.id === 'pastry2' || s.protocol === 'EVENT';

function usageText(s: ServiceSummary) {
  const unit = s.protocol === 'EVENT' ? 'msg' : 'req';
  return `${pluralize(s.operationCount, 'operation')} · ${fmt(s.calls24h)} ${unit} today${isLive(s) ? (s.protocol === 'EVENT' ? ' · publishing on Kafka' : ' · called 12 s ago') : ''}`;
}

const runCounts = (ops?: OperationOutcome[]) => (ops ? `${ops.filter((o) => o === 'pass').length}/${ops.length} ops` : '');

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
        variant="secondary"
        aria-pressed={empty}
        onClick={() => {
          setEmpty(!empty);
          announce(!empty ? 'Showing a fresh install with nothing imported.' : 'Back to the running instance.');
        }}
      >
        {empty ? 'Back to running instance' : 'Show empty install'}
      </Button>
      <Button asChild icon="upload">
        <RouterLink to="/import">Import a contract</RouterLink>
      </Button>
      <Button asChild variant="secondary" icon="play">
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
  const groups = PROTOCOL_ORDER.filter((p) => active.length === 0 || protos.has(p)).map((p) => ({ p, list: services.filter((s) => s.protocol === p) }));
  const shown = groups.reduce((n, g) => n + g.list.length, 0);
  const stepsDone = START_STEPS.filter((s) => done[s.id]).length;
  const firstOpen = START_STEPS.findIndex((s) => !done[s.id]);
  const tests = empty ? [] : data.recentTests;
  const passedRuns = empty ? 0 : 14;
  const failedRuns = empty ? 0 : 6;

  return (
    <div className="ex-stack">
      <PageHeader
        title="Cockpit"
        eyebrow={
          <>
            <span className="ex-mono">microcks.local:8080</span> · Monday, Nov 2, 2026 · 11:20 ·{' '}
            {empty ? 'fresh install, nothing imported yet' : `${live.length} mocks live, ${attention.length} items need attention`}
          </>
        }
        actions={actions}
      />

      <section aria-label="Key figures" className="ex-kpi-grid">
        <div className="ex-kpi">
          <div className="ex-kpi-head">
            <h2>APIs &amp; services</h2>
            <RouterLink to="/services">Catalogue</RouterLink>
          </div>
          <div>
            <span className="ex-kpi-value">{services.length}</span>{' '}
            <span className="ex-secondary">{empty ? 'no contract imported yet' : `${services.reduce((n, s) => n + s.operationCount, 0)} operations`}</span>
          </div>
          <ul className="ex-row ex-plain-list" style={{ display: 'flex', flexWrap: 'wrap' }} aria-label="Services per protocol">
            {PROTOCOL_ORDER.map((p) => (
              <li key={p}>
                <Chip>
                  {p} {services.filter((s) => s.protocol === p).length}
                </Chip>
              </li>
            ))}
          </ul>
        </div>
        <div className="ex-kpi">
          <div className="ex-kpi-head">
            <h2>Mock invocations today</h2>
            {empty ? null : <LiveIndicator />}
          </div>
          <div>
            <span className="ex-kpi-value">{fmt(syncCalls)}</span> <span className="ex-secondary">requests</span>
          </div>
          <div
            className="ex-bars"
            role="img"
            aria-label={empty ? 'No mock invocation yet today' : `Mock requests per hour today, 00 h to 11 h: ${HOURS.join(', ')}`}
          >
            {Array.from({ length: 24 }, (_, h) => {
              const v = empty ? 0 : (HOURS[h] ?? 0);
              const future = h >= HOURS.length;
              return <span key={h} data-future={future ? '' : undefined} style={{ height: future ? '2px' : `${Math.max(2, Math.round((v / hMax) * 100))}%` }} />;
            })}
          </div>
          <span className="ex-small ex-secondary">
            {empty ? 'Mocks appear as soon as a contract is imported.' : `${fmt(msgs)} async messages published · last request 12 s ago`}
          </span>
        </div>
        <div className="ex-kpi">
          <div className="ex-kpi-head">
            <h2>Tests · last 7 days</h2>
            <RouterLink to="/tests/service/pastry2">History</RouterLink>
          </div>
          <div>
            <span className="ex-kpi-value">{passedRuns + failedRuns}</span> <span className="ex-secondary">runs</span>
          </div>
          <div className="ex-meter" role="img" aria-label={empty ? 'No test run yet' : `${passedRuns} passed, ${failedRuns} failed over the last 7 days`}>
            <span style={{ width: `${passedRuns + failedRuns ? (passedRuns / (passedRuns + failedRuns)) * 100 : 0}%`, background: 'var(--success)' }} />
            <span style={{ width: `${passedRuns + failedRuns ? (failedRuns / (passedRuns + failedRuns)) * 100 : 0}%`, background: 'var(--danger)' }} />
          </div>
          <div className="ex-row ex-small">
            <span><Icon name="check" size={14} /> {passedRuns} passed</span>
            <span><Icon name="cross" size={14} /> {failedRuns} failed</span>
          </div>
          <span className="ex-small">
            <RouterLink to="/workflows">Workflows {empty ? 0 : 5}</RouterLink>{' '}
            <span className="ex-secondary">{empty ? '· no Arazzo document imported' : '· 1 failing'}</span>
          </span>
        </div>
        <div className="ex-kpi">
          <div className="ex-kpi-head">
            <h2>Average conformance</h2>
            <RouterLink to="/usage">Details</RouterLink>
          </div>
          <div>
            <span className="ex-kpi-value">{avg === null ? '—' : `${avg}%`}</span> <span className="ex-secondary">{avg === null ? 'no test yet' : 'current score'}</span>
          </div>
          <div className="ex-meter" aria-hidden="true">
            <span style={{ width: `${avg ?? 0}%`, background: (avg ?? 0) >= 80 ? 'var(--success)' : (avg ?? 0) >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
          </div>
          <span className="ex-small ex-secondary">
            {avg === null ? 'Run a first test to get a conformance score.' : `Across ${tested.length} tested services · ${services.length - tested.length} never tested`}
          </span>
        </div>
      </section>

      {empty ? (
        <section aria-label="Getting started" className="ex-grid ex-grid-2">
          <Panel title="Getting started" actions={<span className="ex-small ex-secondary">{stepsDone} of 3 done</span>}>
            <p className="ex-secondary">This Microcks instance has no API yet. Three steps take you from a contract to a live mock and a conformance proof.</p>
            <ol className="ex-plain-list">
              {START_STEPS.map((step, i) => (
                <li key={step.id} className="ex-tile" data-live={i === firstOpen ? '' : undefined}>
                  <div className="ex-row">
                    <Button
                      size="sm"
                      variant={done[step.id] ? 'primary' : 'secondary'}
                      aria-pressed={Boolean(done[step.id])}
                      aria-label={`Mark step ${i + 1} as ${done[step.id] ? 'not done' : 'done'}`}
                      onClick={() => setDone({ ...done, [step.id]: !done[step.id] })}
                    >
                      {done[step.id] ? <Icon name="check" size={14} /> : i + 1}
                    </Button>
                    <span className="ex-tile-title">{step.title}</span>
                  </div>
                  <span className="ex-secondary">{step.desc}</span>
                  {step.code ? <pre className="ex-mono ex-small">{step.code}</pre> : null}
                  <div>
                    <Button asChild variant={i === firstOpen ? 'primary' : 'secondary'} size="sm">
                      <RouterLink to={step.to}>{step.cta}</RouterLink>
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel as="aside" title="Other ways to start" headingLevel={3} aria-label="Other ways to start">
            <ul className="ex-plain-list">
              <li><RouterLink to="/hub">Browse the Hub</RouterLink> <span className="ex-secondary">Install a ready-made API from the community catalogue.</span></li>
              <li><RouterLink to="/importers">Connect a Git repository</RouterLink> <span className="ex-secondary">A scheduled Importer keeps mocks in sync with your contracts.</span></li>
              <li><a href="https://microcks.io/documentation/tutorials/getting-started/" target="_blank" rel="noreferrer">Read the getting-started tutorial (opens in a new tab)</a></li>
            </ul>
          </Panel>
        </section>
      ) : (
        <>
          <Panel
            title="API wall"
            actions={<span className="ex-small ex-secondary" role="status">{active.length ? `${shown} of ${services.length} services` : `${services.length} services`} · {live.length} live now</span>}
          >
            <div className="ex-row" role="group" aria-label="Filter by protocol">
              {PROTOCOL_ORDER.map((p) => (
                <Chip key={p} pressed={protos.has(p)} onClick={() => toggleProto(p)}>
                  {p} {services.filter((s) => s.protocol === p).length}
                </Chip>
              ))}
              {active.length ? <button type="button" className="ex-linkbutton" onClick={() => setProtos(new Set())}>Show all</button> : null}
            </div>
            <div className="ex-stack" style={{ marginTop: 12 }}>
              {groups.filter((g) => g.list.length).map(({ p, list }) => (
                <section key={p} aria-label={`${p} services, ${list.length}`}>
                  <div className="ex-row" style={{ marginBottom: 8 }}>
                    <ApiBadge protocol={p} size="sm" /> <span className="ex-secondary">{list.length}</span>
                  </div>
                  <div className="ex-tiles">
                    {list.map((s) => (
                      <RouterLink
                        key={s.id}
                        className="ex-tile"
                        data-live={isLive(s) ? '' : undefined}
                        to={`/services/${s.id}`}
                      >
                        <span className="ex-row-between">
                          <span className="ex-tile-title">{s.name} <span className="ex-muted">{s.version}</span></span>
                          {isLive(s) ? <LiveIndicator /> : null}
                        </span>
                        <span className="ex-row">
                          <ConformanceBand size="mini" outcomes={toOutcomes(s)} />
                          <span className="ex-small">{s.conformance === null ? 'untested' : `${s.conformance}%`}</span>
                        </span>
                        <span className="ex-small ex-secondary">{usageText(s)}</span>
                      </RouterLink>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <p className="ex-small ex-secondary" style={{ marginBottom: 0 }}>
              Band: one segment per operation, conformant, failing or never tested. Live: mock called or publishing in the last minute.
            </p>
          </Panel>

          <div className="ex-grid ex-grid-2-even">
            <Panel title="Needs attention" actions={<span className="ex-small ex-secondary">{pluralize(attention.length, 'item')}</span>}>
              {attention.length === 0 ? <p>Nothing needs your attention.</p> : null}
              {attention.map((a) => (
                <div key={a.id} className="ex-attn">
                  <Icon name={a.tone === 'danger' ? 'cross' : a.tone === 'warning' ? 'warning' : 'circle'} size={18} />
                  <div className="ex-stack" style={{ gap: 4 }}>
                    <span className="ex-row">
                      <strong>{a.kind}</strong>
                      {a.badge === 'ARAZZO' ? <ApiBadge arazzo name={a.subject} size="sm" /> : a.badge === 'importer' ? <Chip>importer · {a.subject}</Chip> : <ApiBadge protocol={a.badge} name={a.subject} size="sm" />}
                    </span>
                    <span>{a.title}</span>
                    <span className="ex-small ex-secondary">{a.detail}</span>
                  </div>
                  <div className="ex-attn-actions">
                    <Button asChild variant="secondary" size="sm">
                      <RouterLink to={a.to}>{a.cta}</RouterLink>
                    </Button>
                  </div>
                </div>
              ))}
            </Panel>

            <div className="ex-stack">
              <Panel title="Recent tests" actions={<RouterLink to="/tests/service/pastry2">All tests</RouterLink>}>
                <ul className="ex-plain-list">
                  {tests.map((r) => {
                    const svc = byId.get(r.serviceId);
                    const ok = r.result === 'passed';
                    return (
                      <li key={r.id}>
                        <RouterLink
                          to={`/tests/runner/${r.id}`}
                          className="ex-row"
                        >
                          <Icon name={ok ? 'check' : 'cross'} size={14} />
                          <strong>{ok ? 'Passed' : 'Failed'}</strong>
                          {svc ? <ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} size="sm" /> : null}
                          <span className="ex-small ex-secondary">#{r.id} · {r.runner} · {runCounts(r.operations)} · {relative(r.startedAt)}</span>
                        </RouterLink>
                      </li>
                    );
                  })}
                </ul>
              </Panel>

              <Panel title="Most called mocks today" actions={<span className="ex-small ex-secondary">requests</span>}>
                <ol className="ex-plain-list">
                  {top.map((s, i) => (
                    <li key={s.id}>
                      <RouterLink to={`/services/${s.id}`} className="ex-bar-row">
                        <span className="ex-muted">{i + 1}</span>
                        <span>
                          <span className="ex-row"><ApiBadge protocol={s.protocol} size="sm" /> {s.name} <span className="ex-muted">{s.version}</span> {isLive(s) ? <LiveIndicator /> : null}</span>
                          <span className="ex-meter" aria-hidden="true"><span style={{ width: `${Math.max(2, Math.round((s.calls24h / tMax) * 100))}%` }} /></span>
                        </span>
                        <span>{fmt(s.calls24h)}</span>
                      </RouterLink>
                    </li>
                  ))}
                </ol>
                <p className="ex-small ex-secondary">
                  Event APIs publish on their own schedule and are counted apart. <RouterLink to="/usage">Usage &amp; conformance</RouterLink>
                </p>
              </Panel>

              <Panel
                title="Live traces"
                actions={
                  <span className="ex-row">
                    <LiveIndicator paused={ticker.paused} />
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={ticker.paused ? 'play' : 'pause'}
                      aria-pressed={ticker.paused}
                      onClick={() => {
                        ticker.toggle();
                        announce(ticker.paused ? 'Live traces resumed.' : 'Live traces paused.');
                      }}
                    >
                      {ticker.paused ? 'Resume' : 'Pause'}
                    </Button>
                  </span>
                }
              >
                <div role="log" aria-live="off" aria-label="Latest mock calls" className="ex-trace-log">
                  {ticker.value.length === 0 ? <span className="ex-muted">Waiting for the next call…</span> : null}
                  {ticker.value.map((t, i) => (
                    <div key={t.callId} className="ex-trace" data-new={i === 0 && !ticker.paused ? '' : undefined}>
                      <span>{t.at.slice(11, 19)}</span>
                      <span>{t.method}</span>
                      <span className="ex-trace-path">{t.path}</span>
                      <span>{t.status} · {t.ms} ms</span>
                    </div>
                  ))}
                </div>
                <p className="ex-small ex-secondary">
                  Requests and responses as the mocks serve them, with the dispatcher's decision. <RouterLink to="/traces">Open live traces</RouterLink>
                </p>
              </Panel>
            </div>
          </div>
        </>
      )}
      {cockpit.status === 'error' ? <Callout tone="danger" live="assertive">The cockpit could not be refreshed.</Callout> : null}
    </div>
  );
}
