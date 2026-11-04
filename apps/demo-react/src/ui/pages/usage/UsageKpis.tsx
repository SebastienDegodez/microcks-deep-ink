import { Link as RouterLink } from 'react-router';
import { formatCount, type UsageView } from '@/domain/observe';
import { Icon } from '@/ui/components/ui/icon';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { StatCard, StatGrid } from '@/ui/components/ui/stat-card';
import './kpis.css';

const tone = (score: number | null) => (score === null ? 'neutral' : score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger');

/** The four key figures of the Usage page: invocations, peak, last request and conformance. */
export function UsageKpis({ view }: { view: UsageView }) {
  const { kpis, conformance } = view;
  const direction = kpis.growth > 0 ? 'up' : kpis.growth < 0 ? 'down' : 'flat';
  return (
    <StatGrid label="Key figures">
      <StatCard title={`Mock invocations · ${view.periodLabel}`} value={formatCount(kpis.total)}>
        <p className="kpi-trend" data-direction={direction}>
          <Icon name={`trend-${direction}`} size={14} />
          {kpis.trendText}
        </p>
      </StatCard>
      <StatCard title={kpis.peakTitle} value={formatCount(kpis.peak)}>
        <p>{kpis.peakWhen}</p>
      </StatCard>
      <StatCard title="Last request" action={<LiveIndicator size="sm" variant="inline" />} value={kpis.lastCallAgo}>
        <RouterLink className="kpi-path" to={view.scope === 'all' ? '/traces' : `/traces?service=${view.scope}`}>
          {kpis.lastCall}
        </RouterLink>
      </StatCard>
      <StatCard title={conformance.title} value={conformance.score === null ? 'Never tested' : `${conformance.score}%`} tone={tone(conformance.score)}>
        <p>{conformance.subtitle}</p>
      </StatCard>
    </StatGrid>
  );
}
