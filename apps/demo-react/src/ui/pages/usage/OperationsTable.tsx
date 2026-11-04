import { useId } from 'react';
import { Link as RouterLink } from 'react-router';
import { formatCount, formatTrend, type UsageTableRow, type UsageView } from '@/domain/observe';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import './table.css';

const trendDir = (pct: number) => (pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat');

/** "API Pastry 2.0" -> ["API Pastry", "2.0"]. */
function splitVersion(name: string): [string, string | undefined] {
  const at = name.lastIndexOf(' ');
  return at > 0 ? [name.slice(0, at), name.slice(at + 1)] : [name, undefined];
}

/** Invocations per operation (one service) or per service (all), with share bars and trends. */
export function OperationsTable({ view }: { view: UsageView }) {
  const { table } = view;
  const titleId = useId();
  const one = view.scope !== 'all';
  const max = Math.max(1, ...table.rows.map((r) => r.calls));
  return (
    <Panel className="us-table-card" padding="lg" aria-labelledby={titleId}>
      <div className="us-table-head">
        <h2 id={titleId}>{table.title}</h2>
        <span>{table.subtitle}</span>
      </div>
      <div className="table-wrap us-table-wrap">
        <table className="table us-ops" aria-labelledby={titleId}>
          <thead>
            <tr>
              <th scope="col">{table.firstColumn}</th>
              <th scope="col">{table.secondColumn}</th>
              <th scope="col" data-align="end">Invocations</th>
              <th scope="col">Share</th>
              <th scope="col" data-align="end">vs previous</th>
              <th scope="col">Last call</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">
                  <FirstCell row={r} one={one} serviceId={view.scope} />
                </th>
                <td className="us-ops-detail">{r.detail}</td>
                <td className="us-ops-calls" data-align="end">{formatCount(r.calls)}</td>
                <td>
                  <span className="us-ops-share">
                    <span className="us-ops-share-track" aria-hidden="true">
                      <span data-max={r.calls === max ? '' : undefined} style={{ width: `${r.width}%` }} />
                    </span>
                    <span className="us-ops-share-pct">{r.share}%</span>
                  </span>
                </td>
                <td className="us-ops-trend" data-align="end" data-direction={trendDir(r.trend)}>
                  {formatTrend(r.trend)}
                </td>
                <td className="us-ops-last" data-live={r.live ? '' : undefined}>
                  {r.live ? <span className="us-ops-live" aria-hidden="true" /> : null}
                  {r.last}
                  {r.live ? <span className="sr-only">, live</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td />
              <td className="us-ops-calls" data-align="end">{formatCount(table.total)}</td>
              <td className="us-ops-share-pct">100%</td>
              <td className="us-ops-trend" data-align="end" data-direction={trendDir(table.trend)}>
                {formatTrend(table.trend)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      {table.note ? <p className="us-table-note">{table.note}</p> : null}
    </Panel>
  );
}

function FirstCell({ row, one, serviceId }: { row: UsageTableRow; one: boolean; serviceId: string }) {
  if (one) {
    return (
      <RouterLink className="us-ops-op" to={`/services/${serviceId}/operations/${row.id}`}>
        {row.method ? <MethodTag method={row.method} protocol={row.protocol ?? 'REST'} /> : null}
        <span className="us-ops-path">{row.name}</span>
      </RouterLink>
    );
  }
  const [name, version] = splitVersion(row.name);
  return (
    <RouterLink className="us-ops-svc" to={`/services/${row.id}`}>
      <ApiBadge protocol={row.protocol ?? 'REST'} name={name} version={version} size="sm" />
    </RouterLink>
  );
}
