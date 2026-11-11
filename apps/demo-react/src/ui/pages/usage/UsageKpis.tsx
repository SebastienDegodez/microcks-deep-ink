import { Link as RouterLink } from 'react-router';
import { formatCount, type UsageView } from '@/domain/observe';
import { Icon, LiveIndicator, StatCard, StatGrid } from '@microcks/deep-ink';
import { conformanceValue, scoreTone, trendDir } from './figures';
import '@microcks/demo-styles/pages/usage/kpis.css';

/** The four key figures of the Usage page: invocations, peak, last request and conformance. */
export function UsageKpis({ view }: { view: UsageView }) {
  const { kpis, conformance } = view;
  const direction = trendDir(kpis.growth);
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
      <StatCard title={conformance.title} value={conformanceValue(conformance.score)} tone={scoreTone(conformance.score)}>
        <p>{conformance.subtitle}</p>
      </StatCard>
    </StatGrid>
  );
}
