import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { packageTotals, previewInstall, versionOf, type ArtifactRole, type HubPackage, type InstallMode, type InstallStatus } from '@/domain/govern';
import { PageHeader, useAnnounce, usePageTitle, useQuery, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { RadioGroup } from '@/ui/components/ui/checkbox';
import { EmptyState } from '@/ui/components/ui/empty-state';
import { Field } from '@/ui/components/ui/field';
import { Input } from '@/ui/components/ui/input';
import { Panel } from '@/ui/components/ui/panel';
import { Progress } from '@/ui/components/ui/progress';
import { Select } from '@/ui/components/ui/select';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import './hub.css';

export default function HubPage() {
  const { packageId = 'banking' } = useParams();
  usePageTitle('Hub · Microcks');
  const uc = useUseCases();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const categories = useQuery(() => uc.govern.listCategories(), []);
  const list = useQuery(() => uc.govern.listPackages({ query: search || undefined, category: category || undefined }), [search, category]);
  const detail = useQuery(() => uc.govern.getPackage(packageId), [packageId]);
  const total = (categories.data ?? []).reduce((n, c) => n + c.count, 0);

  return (
    <>
      <PageHeader title="Hub" eyebrow="Govern" />
      <div className="hb-grid">
        <Panel title="Packages" as="section">
          <div className="stack">
            <Field label="Search packages">
              {(c) => <Input {...c} type="search" autoComplete="off" value={search} onChange={(e) => setSearch(e.target.value)} />}
            </Field>
            <div role="group" aria-label="Categories" className="demo-actions-row">
              <Chip pressed={category === ''} onClick={() => setCategory('')}>All ({total})</Chip>
              {(categories.data ?? []).map((c) => (
                <Chip key={c.name} pressed={category === c.name} onClick={() => setCategory(c.name)}>
                  {c.name} ({c.count})
                </Chip>
              ))}
            </div>
            <p role="status" className="demo-muted">
              {list.data ? `${list.data.length} ${list.data.length === 1 ? 'package' : 'packages'}` : 'Loading packages'}
            </p>
            {list.status === 'error' ? <ErrorBlock error={list.error} what="Packages" onRetry={list.reload} /> : null}
            {list.data && list.data.length === 0 ? (
              <EmptyState title="No package matches" headingLevel={3}><p>Try another word or category.</p></EmptyState>
            ) : null}
            <ul className="hb-list" aria-busy={list.status === 'loading'}>
              {(list.data ?? []).map((p) => (
                <li key={p.id}>
                  <RouterLink className="hb-pick" to={`/hub/${p.id}`} aria-current={p.id === packageId ? 'true' : undefined}>
                    <span className="hb-pick-name">
                      {p.name}
                      {p.installed ? <Chip tone="success" variant="outline">Installed</Chip> : null}
                    </span>
                    <span className="demo-muted">{p.category} · {p.apiCount} {p.apiCount === 1 ? 'API' : 'APIs'}</span>
                  </RouterLink>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <div aria-live="off">
          {detail.status === 'loading' && !detail.data ? <LoadingBlock label="the package" /> : null}
          {detail.status === 'error' ? <ErrorBlock error={detail.error} what="Package" onRetry={detail.reload} /> : null}
          {detail.data ? (
            <Detail
              key={detail.data.id}
              pkg={detail.data}
              onInstalled={() => {
                detail.reload();
                list.reload();
                categories.reload();
                navigate(`/hub/${detail.data?.id ?? packageId}`);
              }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

function Detail({ pkg, onInstalled }: { pkg: HubPackage; onInstalled: () => void }) {
  const uc = useUseCases();
  const announce = useAnnounce();
  const [version, setVersion] = useState(pkg.versions[0] ?? '');
  const [mode, setMode] = useState<InstallMode>('sync');
  const [role, setRole] = useState<ArtifactRole>('main');
  const [status, setStatus] = useState<InstallStatus>(pkg.installed ? 'installed' : '');
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');

  const picked = useMemo(() => {
    const out: Record<string, string> = {};
    for (const api of pkg.apis ?? []) out[api.name] = api.versions.includes(version) ? version : versionOf(api, {});
    return out;
  }, [pkg, version]);
  const preview = previewInstall(pkg, picked, mode, role, status);
  const totals = packageTotals(pkg, picked);

  const install = async () => {
    setError('');
    setStatus('installing');
    setPercent(0);
    announce(`Installing ${pkg.name}.`);
    try {
      await uc.govern.install(pkg.id, { version, mode, role: 'user', artifactRole: role, versions: picked }, setPercent);
      setStatus('installed');
      announce(`${pkg.name} installed.`);
      onInstalled();
    } catch (e) {
      setStatus('');
      setError(e instanceof Error ? e.message : 'The install failed.');
    }
  };

  return (
    <Panel title={pkg.name} as="section" aria-busy={status === 'installing'}>
      <div className="stack">
        <p>{pkg.description}</p>
        <p className="demo-muted">
          {pkg.category} · {pkg.apiCount} {pkg.apiCount === 1 ? 'API' : 'APIs'} · {totals.operations} operations · {totals.examples} examples{pkg.updated ? ` · ${pkg.updated}` : ''}
        </p>
        {status === 'installed' ? (
          <Callout tone="success" title="Installed" live="polite">
            <p>{pkg.name} is in your catalogue. <RouterLink to="/services">Open APIs & Services</RouterLink></p>
          </Callout>
        ) : (
          <div className="hb-opts">
            <Field label="Version">
              {(c) => (
                <Select {...c} value={version} disabled={status === 'installing'} onChange={(e) => setVersion(e.target.value)}>
                  {pkg.versions.map((v) => <option key={v} value={v}>{v}</option>)}
                </Select>
              )}
            </Field>
            <RadioGroup
              legend="Install mode"
              name="mode"
              value={mode}
              onChange={(v) => setMode(v as InstallMode)}
              options={[
                { value: 'sync', label: 'Keep in sync', description: 'Creates importers in Sources, rescanned every hour.' },
                { value: 'one-shot', label: 'Install once', description: 'Uploads the artifacts one time, no importer.' },
              ]}
            />
            <RadioGroup
              legend="Artifact role"
              name="role"
              value={role}
              onChange={(v) => setRole(v as ArtifactRole)}
              options={[
                { value: 'main', label: 'Primary', description: 'Creates the Services and their mocks.' },
                { value: 'secondary', label: 'Secondary', description: 'Only merges examples into existing Services.' },
              ]}
            />
          </div>
        )}

        <section aria-label={preview.title}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{preview.title}</h3>
          <p className="demo-muted">{preview.subtitle}</p>
          <div className="demo-scroll">
            <table className="hb-table">
              <caption className="sr-only">{preview.title}</caption>
              <thead><tr><th scope="col">Effect</th><th scope="col">API</th><th scope="col">Version</th><th scope="col">Samples</th><th scope="col">Conformance</th></tr></thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.name}>
                    <td>{r.tag}</td>
                    <th scope="row"><ApiBadge protocol={r.protocol} name={r.name} /></th>
                    <td>{r.version}</td>
                    <td>{r.samples}</td>
                    <td>{r.conformance === null ? 'Never tested' : `${r.conformance}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 style={{ margin: '12px 0 4px', fontSize: '1rem' }}>{preview.heading}</h3>
          <ul className="hb-created">
            {preview.created.map((l, i) => (
              <li key={i}>
                <span className="hb-sign" aria-hidden="true">{l.sign}</span>
                <span>{l.text}{l.sub ? <><br /><span className="demo-muted">{l.sub}</span></> : null}</span>
              </li>
            ))}
          </ul>
        </section>

        {status === 'installing' ? <Progress label={`Installing ${pkg.name}`} value={percent} max={100} /> : null}
        {error ? <Callout tone="danger" title="Install failed" live="assertive"><p>{error}</p></Callout> : null}
        {status !== 'installed' ? (
          <div className="demo-actions-row">
            <Button variant="primary" icon="plus" loading={status === 'installing'} disabled={Boolean(preview.blocked)} onClick={install}>
              {status === 'installing' ? 'Installing…' : preview.installLabel}
            </Button>
            {preview.blocked ? <span className="demo-muted">{preview.blocked}</span> : null}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
