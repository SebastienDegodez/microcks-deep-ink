import { useId } from 'react';
import { Link as RouterLink } from 'react-router';
import { BAND_TEXT, conformanceBand, gapList, treemapRows, type ConformanceItem, type DomainConformance, type UsageView } from '@/domain/observe';
import { Icon, type IconName, Panel, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
import './conformance.css';

const PROTO_ATTR: Record<ConformanceItem['protocol'], string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };
const BAND_ICON: Partial<Record<ReturnType<typeof conformanceBand>, IconName>> = { ok: 'check', partial: 'warning', risk: 'close' };
const ops = (n: number) => `${n} ${n === 1 ? 'op' : 'ops'}`;

/** "Conformance" section: risk treemap by domain and index vs current score. Always over all services. */
export function ConformanceSection({ domains, view, selected }: { domains: DomainConformance[]; view: UsageView | undefined; selected: string }) {
  return (
    // A plain div: the "Conformance" key figure is already a region with that name (RGAA 9.2, unique landmarks).
    <div className="conf-section">
      <div className="conf-section-head">
        <h2>Conformance</h2>
        <p>
          How far your implementations follow their contracts, from the latest test of each service. Always computed over all services, whatever the
          selection above.
        </p>
      </div>
      <SplitPane sideWidth="360px" sideMax="none" mainWidth="560px" gap="16px">
        <SplitPaneMain>
          <Treemap domains={domains} selected={selected} />
        </SplitPaneMain>
        {view ? (
          <SplitPaneSide>
            <IndexCard view={view} domains={domains} selected={selected} />
          </SplitPaneSide>
        ) : null}
      </SplitPane>
    </div>
  );
}

function Treemap({ domains, selected }: { domains: DomainConformance[]; selected: string }) {
  const titleId = useId();
  const rows = treemapRows(domains);
  return (
    <Panel className="treemap-card" padding="lg" aria-labelledby={titleId}>
      <div className="card-head">
        <h3 id={titleId}>Conformance risk by domain</h3>
        <p>
          Grouped by the <code>domain</code> label · area = number of operations · the lower the score, the higher the risk
        </p>
      </div>
      <div className="treemap">
        {rows.map((row, r) => (
          <div key={r} className="treemap-row" style={{ flex: `${row.operations} 1 0px` }}>
            {row.domains.map((d) => {
              const band = conformanceBand(d.score);
              return (
                <section key={d.domain} className="treemap-domain" style={{ flex: `${d.operations} 1 0px` }} aria-label={d.label}>
                  <div className="treemap-domain-head">
                    <span className="treemap-domain-label">{d.label}</span>
                    <span className="treemap-domain-avg" data-band={band}>
                      {d.score === null ? 'untested' : `avg ${d.score}%`} · {ops(d.operations)}
                    </span>
                  </div>
                  <ul className="treemap-services">
                    {(d.items ?? []).map((it) => (
                      <li key={it.serviceId} style={{ flex: `${it.operations} 1 0px` }}>
                        <ServiceRect item={it} selected={it.serviceId === selected} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        ))}
      </div>
      <div className="treemap-legend">
        <span><span className="treemap-swatch" data-band="ok" aria-hidden="true" />≥ 80% conformant</span>
        <span><span className="treemap-swatch" data-band="partial" aria-hidden="true" />50–79% partial</span>
        <span><span className="treemap-swatch" data-band="risk" aria-hidden="true" />&lt; 50% at risk</span>
        <span><span className="treemap-swatch" data-band="untested" aria-hidden="true" />never tested</span>
        <span className="treemap-legend-end">
          Group by <code>domain</code> · set in Administration
        </span>
      </div>
    </Panel>
  );
}

function ServiceRect({ item, selected }: { item: ConformanceItem; selected: boolean }) {
  const band = conformanceBand(item.score);
  const icon = BAND_ICON[band];
  const size = item.score === null ? 'untested' : item.operations >= 3 ? 'lg' : 'md';
  return (
    <RouterLink className="treemap-rect" data-band={band} data-narrow={item.operations === 1 ? '' : undefined} aria-current={selected ? 'true' : undefined} to={`/services/${item.serviceId}`}>
      <span className="treemap-rect-text">
        <span className="treemap-rect-name">{item.name}</span>
        <span className="sr-only">, </span>
        <span className="treemap-rect-meta">
          {ops(item.operations)} · {item.protocol}
        </span>
      </span>
      <span className="treemap-rect-score" data-size={size}>
        {icon ? <Icon name={icon} size={13} /> : null}
        {item.score === null ? (
          <><span className="sr-only">, </span>untested</>
        ) : (
          <>
            <span className="sr-only">, conformance </span>
            {item.score}%<span className="sr-only">, {BAND_TEXT[band]}</span>
          </>
        )}
      </span>
    </RouterLink>
  );
}

const TREND_ICON: Record<NonNullable<UsageView['conformance']['direction']>, IconName> = {
  up: 'trend-up',
  down: 'trend-down',
  stable: 'trend-flat',
  mixed: 'trend-flat',
};

function IndexCard({ view, domains, selected }: { view: UsageView; domains: DomainConformance[]; selected: string }) {
  const titleId = useId();
  const c = view.conformance;
  const band = conformanceBand(c.score);
  const index = c.index ?? 0;
  const gaps = gapList(domains);
  return (
    <Panel className="index-card" padding="lg" aria-labelledby={titleId}>
      <div className="card-head">
        <h3 id={titleId}>Conformance index vs current score</h3>
        <p>{c.subject}</p>
      </div>
      <dl className="index-figures">
        <div>
          <dt>Current score</dt>
          <dd className="index-figure" data-band={band}>{c.score === null ? '—' : `${c.score}%`}</dd>
        </div>
        <div>
          <dt>Conformance index</dt>
          <dd className="index-figure">{index}%</dd>
        </div>
        {c.trend ? (
          <div>
            <dt>Trend</dt>
            <dd className="index-trend" data-direction={c.direction ?? 'stable'}>
              <Icon name={TREND_ICON[c.direction ?? 'stable']} size={14} />
              {c.trend}
            </dd>
          </div>
        ) : null}
      </dl>
      <div
        className="index-bar"
        role="img"
        aria-label={`${view.scope === 'all' ? 'Average current score' : 'Current score'} ${c.score ?? 0} percent, ${view.scope === 'all' ? 'average ' : ''}conformance index ${index} percent`}
      >
        <div className="index-bar-track">
          <span className="index-bar-index" style={{ width: `${index}%` }} />
          <span className="index-bar-score" data-band={band} style={{ width: `${c.score ?? 0}%` }} />
        </div>
        <div className="index-bar-axis" aria-hidden="true">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      <dl className="index-defs">
        <div>
          <dt>
            <span className="index-swatch" data-kind="index" aria-hidden="true" />
            Conformance index:
          </dt>{' '}
          <dd>
            the maximum score your tests can reach with the examples attached to the contract. It grows with the number of examples per operation and the
            coverage of dispatching rules.
          </dd>
        </div>
        <div>
          <dt>
            <span className="index-swatch" data-band={band} aria-hidden="true" />
            Current score:
          </dt>{' '}
          <dd>the score of the latest test. It equals the index only when every operation passes.</dd>
        </div>
      </dl>
      {c.advice ? (
        <div className="index-note" role="note">
          <Icon name="info" size={16} />
          <span>{c.advice}</span>
        </div>
      ) : null}
      <div className="gap-list">
        <h4>Gap per service</h4>
        <ul>
          {gaps.map((g) => {
            const b = conformanceBand(g.score);
            return (
              <li key={g.serviceId}>
                <RouterLink className="gap-row" to={`/services/${g.serviceId}`} aria-current={g.serviceId === selected ? 'true' : undefined}>
                  <span className="gap-proto" data-protocol={PROTO_ATTR[g.protocol]}>{g.protocol}</span>
                  <span className="sr-only"> </span>
                  <span className="gap-name">{g.name}</span>
                  <span className="gap-bar" aria-hidden="true">
                    <span className="index-bar-index" style={{ width: `${g.index}%` }} />
                    <span className="index-bar-score" data-band={b} style={{ width: `${g.score ?? 0}%` }} />
                  </span>
                  <span className="gap-pair" data-band={b}>
                    <span className="sr-only">: score </span>
                    {g.score === null ? <><span aria-hidden="true">—</span><span className="sr-only">never tested</span></> : g.score}
                    <span aria-hidden="true"> / </span>
                    <span className="sr-only">, index </span>
                    {g.index}%
                  </span>
                </RouterLink>
              </li>
            );
          })}
        </ul>
      </div>
    </Panel>
  );
}
