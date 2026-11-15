<script lang="ts">
  import '@microcks/demo-styles/pages/hub/hub.css';
  import type { ArtifactRole, HubPackage, InstallMode, InstallStatus } from '@microcks/demo-core/domain/govern';
  import { Chip, FilterSearch, Icon, SplitPane, SplitPaneMain, SplitPaneSide, TileGrid } from '@microcks/deep-ink';
  import { PageHeader, useAnnounce, useNavigate, usePageTitle, useParams, useQuery, useReturnFocus, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import Detail from './Detail.svelte';
  import PackageTile from './PackageTile.svelte';
  import {
    HUB_URL, apiTotalOf, categoryCount, countLabel, installErrorMessage, installStatusOf, installVersion, installedMessage, installingMessage, selectedPackage,
    shownPackages,
  } from './packages';

  /** `/hub/:packageId?`: the community packages of the Hub, filtered by text and category, and the selected one in detail. */
  const params = useParams();
  const packageId = $derived(params.packageId ?? 'banking');
  usePageTitle(() => 'Hub · Microcks');
  const uc = useUseCases();
  const navigate = useNavigate();
  const announce = useAnnounce();
  let search = $state('');
  let category = $state('');
  let status = $state.raw<Record<string, InstallStatus>>({});
  let how = $state.raw<Record<string, InstallMode>>({});
  let error = $state('');
  // The install button unmounts when clicked: focus goes to the element that replaces it once it renders.
  const { focusLater } = useReturnFocus();
  const setFocusId = (id: string) => focusLater(() => document.getElementById(id));
  const categories = useQuery(() => uc.govern.listCategories());
  // Counts follow the search: fetch by query, filter the category here.
  const list = useQuery(() => uc.govern.listPackages({ query: search || undefined }), () => [search]);

  const byQuery = $derived(list.data ?? []);
  const shown = $derived(shownPackages(byQuery, category));
  const selected = $derived(selectedPackage(shown, packageId));
  const statusOf = (p: HubPackage): InstallStatus => installStatusOf(p, status);
  const apiTotal = $derived(apiTotalOf(shown));

  const select = (id: string) => {
    if (id !== packageId) navigate(`/hub/${id}`);
  };

  const install = async (pkg: HubPackage, mode: InstallMode, role: ArtifactRole, picked: Record<string, string>, from: 'card' | 'detail') => {
    if (statusOf(pkg)) return;
    const target = from === 'card' ? `hb-card-${pkg.id}` : 'hb-detail';
    select(pkg.id);
    error = '';
    status = { ...status, [pkg.id]: 'installing' };
    setFocusId(`${target}-live`);
    how = { ...how, [pkg.id]: mode };
    announce(installingMessage(pkg));
    try {
      const version = installVersion(pkg, picked);
      await uc.govern.install(pkg.id, { version, mode, role: 'user', artifactRole: role, versions: picked });
      status = { ...status, [pkg.id]: 'installed' };
      setFocusId(`${target}-view`);
      announce(installedMessage(pkg));
    } catch (e) {
      status = { ...status, [pkg.id]: '' };
      setFocusId(target);
      error = installErrorMessage(e);
    }
  };

  const reset = () => {
    search = '';
    category = '';
  };
</script>

{#snippet actions()}<span class="hb-connected"
    ><Icon name="check" size={14} class="hb-connected-icon" />Connected to<span class="hb-connected-url">{HUB_URL}</span></span
  >{/snippet}

<PageHeader
  title="Hub"
  descriptionWidth={760}
  description="Community packages of API mocks and conformance tests. Install one to get its Services, examples and tests in this instance, once or kept in sync."
  {actions}
/><div class="hb-filters"
  ><div class="hb-search-row"
    ><FilterSearch
      size="lg"
      label="Search packages and APIs"
      placeholder="Search packages, APIs, protocols…"
      autocomplete="off"
      value={search}
      oninput={(e) => (search = e.currentTarget.value)}
    /><span role="status" class="hb-count">{list.data ? countLabel(shown.length, apiTotal) : 'Loading packages'}</span></div
  ><div role="group" aria-label="Categories" class="hb-cats"
    ><Chip size="lg" pressed={category === ''} count={byQuery.length} onclick={() => (category = '')}>All</Chip
    >{#each categories.data ?? [] as c (c.name)}<Chip size="lg" pressed={category === c.name} count={categoryCount(byQuery, c.name)} onclick={() => (category = c.name)}
        >{c.name}</Chip
      >{/each}</div
  ></div
><SplitPane sideWidth="400px" sideMax="560px" mainWidth="560px" keepSideMax
  ><SplitPaneMain
    ><TileGrid label="Packages" aria-busy={list.status === 'loading'}
      >{#if list.status === 'loading' && !list.data}<LoadingBlock label="packages" />{/if}{#if list.status === 'error'}<ErrorBlock
          error={list.error}
          what="Packages"
          onretry={list.reload}
        />{/if}{#each shown as p (p.id)}<PackageTile
          pkg={p}
          selected={p.id === selected?.id}
          status={statusOf(p)}
          onselect={() => select(p.id)}
          oninstall={() => void install(p, 'sync', 'main', {}, 'card')}
        />{/each}{#if list.data && shown.length === 0}<div class="hb-empty"
          >No package matches this search.<button type="button" class="hb-empty-reset" onclick={reset}>Clear search and category</button></div
        >{/if}</TileGrid
    ></SplitPaneMain
  >{#if selected}<SplitPaneSide
      >{#key selected.id}<Detail
          pkg={selected}
          status={statusOf(selected)}
          installedMode={how[selected.id] ?? 'sync'}
          {error}
          oninstall={(mode, role, picked) => void install(selected, mode, role, picked, 'detail')}
        />{/key}</SplitPaneSide
    >{/if}</SplitPane
>
