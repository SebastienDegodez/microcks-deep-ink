import { useId, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { USAGE_PERIODS, type UsagePeriod } from '@/domain/observe';
import { PageHeader, usePageTitle, useQuery, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { SectionLabel } from '@/ui/components/ui/section-label';
import { Segmented } from '@/ui/components/ui/segmented';
import { Select } from '@/ui/components/ui/select';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { ConformanceSection } from './ConformanceSection';
import { HourlyChart } from './HourlyChart';
import { OperationsTable } from './OperationsTable';
import { UsageHeatmap } from './UsageHeatmap';
import { UsageKpis } from './UsageKpis';
import './usage.css';

export default function UsagePage() {
  const { serviceId } = useParams();
  const scope = serviceId ?? 'all';
  usePageTitle('Usage & conformance · Microcks');
  const uc = useUseCases();
  const navigate = useNavigate();
  const selectId = useId();
  const [period, setPeriod] = useState<UsagePeriod>('today');
  const services = useQuery(() => uc.catalog.listServices(), []);
  const scopes = useQuery(() => uc.observe.usageScopes(), []);
  const usage = useQuery(() => uc.observe.usage(scope, period), [scope, period]);
  const domains = useQuery(() => uc.observe.conformanceByDomain(), []);
  const view = usage.data;
  const service = (services.data ?? []).find((s) => s.id === scope);

  return (
    <>
      <PageHeader
        title="Usage & conformance"
        size="lg"
        description={
          view ? (
            <span className="us-scope">
              {service ? (
                <RouterLink className="us-scope-badge" to={`/services/${service.id}`}>
                  <ApiBadge protocol={service.protocol} name={service.name} version={service.version} size="sm" />
                </RouterLink>
              ) : null}
              <span>{view.scopeLine}</span>
            </span>
          ) : undefined
        }
        actions={
          <div className="us-controls">
            <div className="us-control">
              <SectionLabel as="label" htmlFor={selectId}>
                Service
              </SectionLabel>
              <Select id={selectId} value={scope} onChange={(e) => navigate(e.target.value === 'all' ? '/metrics' : `/metrics/${e.target.value}`)}>
                {(scopes.data ?? [{ id: 'all', label: 'All services' }]).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="us-control">
              <SectionLabel aria-hidden="true">Period</SectionLabel>
              <Segmented spacing="wide" label="Period" options={USAGE_PERIODS} value={period} onChange={(id) => setPeriod(id as UsagePeriod)} />
            </div>
          </div>
        }
      />
      <div className="us-page">
        {usage.status === 'loading' && !view ? <LoadingBlock label="usage" /> : null}
        {usage.status === 'error' ? <ErrorBlock error={usage.error} what="Usage" onRetry={usage.reload} /> : null}
        {view ? (
          <div className="us-page" aria-busy={usage.status === 'loading'}>
            <UsageKpis view={view} />
            <HourlyChart key={`${view.scope}-${view.period}`} view={view} />
            <div className="us-split">
              <UsageHeatmap key={`h-${view.scope}`} view={view} />
              <OperationsTable view={view} />
            </div>
          </div>
        ) : null}
        {domains.data ? <ConformanceSection domains={domains.data} view={view} selected={scope} /> : null}
      </div>
    </>
  );
}
