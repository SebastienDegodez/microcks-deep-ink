import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import {
  packageTotals,
  previewInstall,
  versionOf,
  type ArtifactRole,
  type CreatedLine,
  type HubPackage,
  type InstallMode,
  type InstallStatus,
  type PreviewRow,
} from '@/domain/govern';
import { plural } from '@/ui/app/format';
import { PageHeader, useAnnounce, usePageTitle, useQuery, useReturnFocus, useUseCases } from '@/ui/app';
import { ApiBadge, Button, Callout, Chip, RadioGroup, FilterSearch, Icon, LiveIndicator, Panel, SectionLabel, SplitPane, SplitPaneMain, SplitPaneSide, Tile, TileGrid } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import './hub.css';

const HUB_URL = 'https://hub.microcks.io/api';
const metaOf = (p: HubPackage) => `${plural(p.apiCount, 'API')}${p.updated ? ` · ${p.updated}` : ''}`;

export default function HubPage() {
  const { packageId = 'banking' } = useParams();
  usePageTitle('Hub · Microcks');
  const uc = useUseCases();
  const navigate = useNavigate();
  const announce = useAnnounce();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<Record<string, InstallStatus>>({});
  const [how, setHow] = useState<Record<string, InstallMode>>({});
  const [error, setError] = useState('');
  // The install button unmounts when clicked: focus goes to the element that replaces it once it renders.
  const { focusLater } = useReturnFocus();
  const setFocusId = (id: string) => focusLater(() => document.getElementById(id));
  const categories = useQuery(() => uc.govern.listCategories(), []);
  // Counts follow the search: fetch by query, filter the category here.
  const list = useQuery(() => uc.govern.listPackages({ query: search || undefined }), [search]);

  const byQuery = list.data ?? [];
  const shown = byQuery.filter((p) => !category || p.category === category);
  const selected = shown.find((p) => p.id === packageId) ?? shown[0];
  const statusOf = (p: HubPackage): InstallStatus => status[p.id] ?? (p.installed ? 'installed' : '');
  const apiTotal = shown.reduce((n, p) => n + p.apiCount, 0);

  const select = (id: string) => {
    if (id !== packageId) navigate(`/hub/${id}`);
  };

  const install = async (pkg: HubPackage, mode: InstallMode, role: ArtifactRole, picked: Record<string, string>, from: 'card' | 'detail') => {
    if (statusOf(pkg)) return;
    const target = from === 'card' ? `hb-card-${pkg.id}` : 'hb-detail';
    select(pkg.id);
    setError('');
    setStatus((s) => ({ ...s, [pkg.id]: 'installing' }));
    setFocusId(`${target}-live`);
    setHow((h) => ({ ...h, [pkg.id]: mode }));
    announce(`Installing ${pkg.name}.`);
    try {
      const first = pkg.apis?.[0];
      const version = first ? versionOf(first, picked) : (pkg.versions[0] ?? '');
      await uc.govern.install(pkg.id, { version, mode, role: 'user', artifactRole: role, versions: picked });
      setStatus((s) => ({ ...s, [pkg.id]: 'installed' }));
      setFocusId(`${target}-view`);
      announce(`${pkg.name} installed.`);
    } catch (e) {
      setStatus((s) => ({ ...s, [pkg.id]: '' }));
      setFocusId(target);
      setError(e instanceof Error ? e.message : 'The install failed.');
    }
  };

  return (
    <>
      <PageHeader
        title="Hub"
        descriptionWidth={760}
        description="Community packages of API mocks and conformance tests. Install one to get its Services, examples and tests in this instance, once or kept in sync."
        actions={
          <span className="hb-connected">
            <Icon name="check" size={14} />
            Connected to
            <span className="hb-connected-url">{HUB_URL}</span>
          </span>
        }
      />
      <div className="hb-filters">
        <div className="hb-search-row">
          <FilterSearch
            size="lg"
            label="Search packages and APIs"
            placeholder="Search packages, APIs, protocols…"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span role="status" className="hb-count">
            {list.data ? `${plural(shown.length, 'package')} · ${plural(apiTotal, 'API')}` : 'Loading packages'}
          </span>
        </div>
        <div role="group" aria-label="Categories" className="hb-cats">
          <Chip size="lg" pressed={category === ''} count={byQuery.length} onClick={() => setCategory('')}>
            All
          </Chip>
          {(categories.data ?? []).map((c) => (
            <Chip key={c.name} size="lg" pressed={category === c.name} count={byQuery.filter((p) => p.category === c.name).length} onClick={() => setCategory(c.name)}>
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <SplitPane sideWidth="400px" sideMax="560px" mainWidth="560px" keepSideMax>
        <SplitPaneMain>
          <TileGrid label="Packages" aria-busy={list.status === 'loading'}>
            {list.status === 'loading' && !list.data ? <LoadingBlock label="packages" /> : null}
            {list.status === 'error' ? <ErrorBlock error={list.error} what="Packages" onRetry={list.reload} /> : null}
            {shown.map((p) => (
              <PackageTile
                key={p.id}
                pkg={p}
                selected={p.id === selected?.id}
                status={statusOf(p)}
                onSelect={() => select(p.id)}
                onInstall={() => void install(p, 'sync', 'main', {}, 'card')}
              />
            ))}
            {list.data && shown.length === 0 ? (
              <div className="hb-empty">
                No package matches this search.
                <button
                  type="button"
                  className="hb-empty-reset"
                  onClick={() => {
                    setSearch('');
                    setCategory('');
                  }}
                >
                  Clear search and category
                </button>
              </div>
            ) : null}
          </TileGrid>
        </SplitPaneMain>

        {selected ? (
          <SplitPaneSide>
            <Detail
              key={selected.id}
              pkg={selected}
              status={statusOf(selected)}
              installedMode={how[selected.id] ?? 'sync'}
              error={error}
              onInstall={(mode, role, picked) => void install(selected, mode, role, picked, 'detail')}
            />
          </SplitPaneSide>
        ) : null}
      </SplitPane>
    </>
  );
}

function PackageTile({
  pkg,
  selected,
  status,
  onSelect,
  onInstall,
}: {
  pkg: HubPackage;
  selected: boolean;
  status: InstallStatus;
  onSelect: () => void;
  onInstall: () => void;
}) {
  const totals = packageTotals(pkg, {});
  return (
    <Tile
      title={pkg.name}
      headingLevel={2}
      selected={selected}
      onSelect={onSelect}
      meta={
        <>
          maintained by <b>community</b> · {metaOf(pkg)}
        </>
      }
      aside={<span className="tile-tag">{pkg.category}</span>}
      footer={
        <>
          {status === '' ? (
            <Button variant="primary" size="tile" icon="download" onClick={onInstall}>
              Install
            </Button>
          ) : null}
          {status === 'installing' ? (
            <LiveIndicator id={`hb-card-${pkg.id}-live`} tabIndex={-1} variant="box" label={`live · installing ${pkg.apiCount} APIs`} />
          ) : null}
          {status === 'installed' ? (
            <>
              <span className="hb-installed">
                <Icon name="check" size={15} />
                Installed
              </span>
              <Button asChild size="tile">
                <RouterLink id={`hb-card-${pkg.id}-view`} to="/services">
                  View in catalogue
                  <Icon name="arrow-right" size={13} />
                </RouterLink>
              </Button>
            </>
          ) : null}
          <span className="tile-footer-end">
            {totals.operations} ops · {totals.examples} examples
          </span>
        </>
      }
    >
      <p>{pkg.description}</p>
      <div className="tile-badges">
        {(pkg.apis ?? []).map((a) => (
          <ApiBadge key={a.name} size="sm" protocol={a.protocol} name={a.name} version={a.versions[0]} />
        ))}
      </div>
    </Tile>
  );
}

const MODE_OPTIONS = [
  { value: 'sync', label: 'Keep in sync', description: 'Creates one importer per artifact in Sources, rescanned every hour.' },
  { value: 'one-shot', label: 'Import once', description: 'Direct upload of the artifacts. Later package updates are not applied.' },
];
const ROLE_OPTIONS = [
  { value: 'main', label: 'Main artifact', description: 'Creates Services, operations and examples from the contracts.' },
  { value: 'secondary', label: 'Secondary artifact', description: 'Only merges examples into Services that already exist here.' },
];

function Detail({
  pkg,
  status,
  installedMode,
  error,
  onInstall,
}: {
  pkg: HubPackage;
  status: InstallStatus;
  installedMode: InstallMode;
  error: string;
  onInstall: (mode: InstallMode, role: ArtifactRole, picked: Record<string, string>) => void;
}) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<InstallMode>('sync');
  const [role, setRole] = useState<ArtifactRole>('main');
  const apis = pkg.apis ?? [];
  const effectiveMode = status ? installedMode : mode;
  const effectiveRole = status ? 'main' : role;
  const preview = useMemo(() => previewInstall(pkg, picked, effectiveMode, effectiveRole, status), [pkg, picked, effectiveMode, effectiveRole, status]);

  return (
    <Panel as="section" padding="lg" className="hb-detail" aria-label="Package detail" aria-busy={status === 'installing'}>
      <div className="hb-detail-head">
        <div className="hb-detail-title">
          <h2>{pkg.name}</h2>
          <span className="tile-tag">{pkg.category}</span>
        </div>
        <p className="hb-detail-desc">{pkg.description}</p>
        <span className="hb-detail-meta">
          maintained by community · {metaOf(pkg)} · <span className="demo-mono">hub.microcks.io/package/{pkg.id}</span>
        </span>
      </div>

      <div className="hb-block">
        <SectionLabel as="h3">{plural(apis.length, 'API in this package', 'APIs in this package')}</SectionLabel>
        {apis.map((a) => {
          const v = versionOf(a, picked);
          return (
            <div key={a.name} className="hb-api">
              <div className="hb-api-head">
                <ApiBadge size="compact" protocol={a.protocol} name={a.name} />
                <div role="group" aria-label={`Version of ${a.name}`} className="hb-versions">
                  {a.versions.map((x) => (
                    <button key={x} type="button" aria-pressed={x === v} onClick={() => setPicked((p) => ({ ...p, [a.name]: x }))}>
                      {x}
                    </button>
                  ))}
                </div>
              </div>
              <div className="hb-api-facts">
                <span>
                  {plural(a.operations[v] ?? 0, 'operation')} · {a.examples[v] ?? 0} examples
                </span>
                <span className="demo-mono">{a.contracts}</span>
                {a.inCatalogue.includes(v) ? (
                  <span className="hb-exists">
                    <Icon name="check" size={12} />
                    already in your catalogue
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {status === '' ? (
        <div className="hb-options">
          <RadioGroup
            variant="card"
            className="hb-fieldset"
            legend={<SectionLabel>How to install</SectionLabel>}
            name="hub-mode"
            value={mode}
            onChange={(v) => setMode(v as InstallMode)}
            options={MODE_OPTIONS}
          />
          <RadioGroup
            variant="card"
            className="hb-fieldset"
            legend={<SectionLabel>Artifact role</SectionLabel>}
            name="hub-role"
            value={role}
            onChange={(v) => setRole(v as ArtifactRole)}
            options={ROLE_OPTIONS}
          />
        </div>
      ) : null}

      <section className="hb-block" aria-labelledby={`hb-preview-${pkg.id}`}>
        <div className="hb-preview-head">
          <h3 id={`hb-preview-${pkg.id}`}>{preview.title}</h3>
          <span>{preview.subtitle}</span>
        </div>
        <ul className="hb-preview">
          {preview.rows.map((r) => (
            <PreviewBadges key={r.name} row={r} />
          ))}
        </ul>
      </section>

      <div className="hb-block">
        <SectionLabel as="h3">{preview.heading}</SectionLabel>
        <ul className="hb-created">
          {preview.created.map((l, i) => (
            <CreatedItem key={i} line={l} />
          ))}
        </ul>
        {preview.blocked && status === '' ? (
          <Callout tone="warning" variant="outline">
            <p>{preview.blocked}</p>
          </Callout>
        ) : null}
      </div>

      {error ? (
        <Callout tone="danger" title="Install failed" live="assertive">
          <p>{error}</p>
        </Callout>
      ) : null}

      <div className="hb-actions">
        {status === '' ? (
          <>
            <Button variant="primary" size="lg" icon="download" disabled={Boolean(preview.blocked)} onClick={() => onInstall(mode, role, picked)}>
              {preview.installLabel}
            </Button>
            <span className="hb-hint">Nothing is written before you click.</span>
          </>
        ) : null}
        {status === 'installing' ? <LiveIndicator id="hb-detail-live" tabIndex={-1} variant="box" size="lg" label="live · fetching and importing artifacts" /> : null}
        {status === 'installed' ? (
          <>
            <span className="hb-installed">
              <Icon name="check" size={15} />
              Installed
            </span>
            <Button variant="primary" asChild>
              <RouterLink id="hb-detail-view" to="/services">
                View in catalogue
                <Icon name="arrow-right" size={14} />
              </RouterLink>
            </Button>
            {installedMode === 'sync' ? (
              <Button asChild>
                <RouterLink to="/sources">See importers in Sources</RouterLink>
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </Panel>
  );
}

function PreviewBadges({ row }: { row: PreviewRow }) {
  return (
    <li className="hb-preview-row" data-skipped={row.tag === 'SKIPPED' ? '' : undefined}>
      <span className="hb-tag" data-tag={row.tag.toLowerCase().replace(' ', '-')}>
        {row.tag}
      </span>
      <ApiBadge size="compact" protocol={row.protocol} name={row.name} version={row.version} />
      <ApiBadge size="compact" label="samples" value={String(row.samples)} status="action" />
      <ApiBadge
        size="compact"
        label="conformance"
        value={row.conformance === null ? 'not tested' : `${row.conformance}%`}
        status={row.conformance === null ? 'neutral' : 'success'}
      />
      {row.mcp ? <ApiBadge size="compact" label="mcp" value="agent-ready" status="info" /> : null}
    </li>
  );
}

const SIGN_TONE: Record<CreatedLine['sign'], string> = { '+': 'success', '~': 'warning', '↑': 'link', '→': 'muted', '·': 'muted', '✓': 'success' };

function CreatedItem({ line }: { line: CreatedLine }) {
  return (
    <li>
      <span className="hb-sign" data-tone={SIGN_TONE[line.sign]} aria-hidden="true">
        {line.sign}
      </span>
      <span className="hb-created-text">
        <span>{line.text}</span>
        {line.sub ? <span className="hb-created-sub">{line.sub}</span> : null}
      </span>
    </li>
  );
}
