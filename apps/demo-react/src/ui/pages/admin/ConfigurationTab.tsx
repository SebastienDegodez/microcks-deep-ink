import { useQuery, useUseCases } from '@/ui/app';
import { Icon } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import './configuration.css';

/** Read-only: Microcks reads these values at start-up. */
export function ConfigurationTab() {
  const uc = useUseCases();
  const flags = useQuery(() => uc.govern.listFlags(), []);
  if (flags.status === 'error') return <ErrorBlock error={flags.error} what="Configuration" onRetry={flags.reload} />;
  if (!flags.data) return <LoadingBlock label="configuration" />;
  return (
    <div className="ad-tab">
      <div role="note" className="ad-lock-note">
        <Icon name="lock" size={14} />
        <span>
          Read-only. These values come from <span className="demo-mono">application.properties</span> and <span className="demo-mono">features.properties</span>, or from your Helm values or Operator resource. Change them there and restart Microcks.
        </span>
      </div>
      <ul className="ad-card ad-flags" aria-label="Features and their configuration">
        {flags.data.map((f) => (
          <li key={f.id} className="ad-flag">
            <span className="ad-flag-text">
              <span className="ad-flag-label">{f.label}</span>
              <span className="ad-flag-desc">{f.description}</span>
            </span>
            <span className="ad-flag-state" data-on={f.enabled ? '' : undefined}>
              <Icon name={f.enabled ? 'check' : 'circle'} size={14} />
              {f.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <span className="ad-flag-value">{f.value ?? '—'}</span>
            <span className="ad-flag-key">{f.key}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
