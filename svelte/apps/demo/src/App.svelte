<script lang="ts">
  import { tick } from 'svelte';
  import {
    AppShell,
    Button,
    ButtonLink,
    Callout,
    CommandBar,
    EmptyState,
    Icon,
    ThemeToggle,
    type CommandItem,
  } from '@microcks/deep-ink';
  import { nav, screens, services, navigate, readRoute } from './data';
  import Explore from './pages/Explore.svelte';
  import Service from './pages/Service.svelte';
  import Sources from './pages/Sources.svelte';
  import Tests from './pages/Tests.svelte';
  import Workflows from './pages/Workflows.svelte';
  import Agents from './pages/Agents.svelte';
  import Observe from './pages/Observe.svelte';
  import Govern from './pages/Govern.svelte';

  let hash = $state(window.location.hash);
  let palette = $state(false);
  const route = $derived(readRoute(hash));
  const active = $derived(
    route.path === '/'
      ? 'cockpit'
      : route.path.startsWith('/services')
        ? 'catalogue'
        : route.path.split('/')[1],
  );
  const commands: CommandItem[] = screens.map((s) => ({
    id: s.href,
    label: `Go to ${s.title}`,
    kind: 'action',
  }));
  const serviceCommands: CommandItem[] = services.map((s) => ({
    id: `/services/${s.id}`,
    label: s.name,
    kind: 'service',
    protocol: s.protocol,
  }));

  $effect(() => {
    route.path;
    void tick().then(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      if (heading) {
        document.title = `${heading.textContent} · Microcks DEMO (Svelte)`;
        heading.focus();
      }
    });
  });
</script>

<svelte:window onhashchange={() => (hash = window.location.hash)} />
{#snippet brand()}<a href="#/" class="demo-brand"
    ><Icon name="badge-wall" size={28} />Microcks</a
  >{/snippet}
{#snippet search()}<Button
    variant="outline"
    class="demo-search"
    icon="search"
    onclick={() => (palette = true)}
    >Search an API, an operation, a command... <kbd>⌘K</kbd></Button
  >{/snippet}
{#snippet actions()}<ButtonLink
    href="#/sources/new"
    variant="primary"
    icon="download">Import a contract</ButtonLink
  ><ThemeToggle /><span class="demo-avatar" aria-label="Signed in as MA"
    >MA</span
  >{/snippet}
{#snippet banner()}<div class="demo-banner">
    <strong>DEMO</strong><span
      >Microcks UI v2 proposal · Svelte · In-memory data, nothing is saved ·
      Accessibility: not audited</span
    ><a href="#/map">19-screen map</a>
  </div>{/snippet}
<AppShell
  {brand}
  {nav}
  activeId={active}
  topbarCenter={search}
  topbarActions={actions}
  {banner}
>
  {#key hash}
    {#if route.path === '/' || route.path === '/services' || route.path === '/map'}
      <Explore path={route.path} />
    {:else if route.path.startsWith('/sources')}
      <Sources path={route.path} />
    {:else if route.path.startsWith('/services/concierge') || route.path.startsWith('/tests/agent/')}
      <Agents path={route.path} />
    {:else if route.path.startsWith('/services/')}
      <Service path={route.path} />
    {:else if route.path.startsWith('/tests')}
      <Tests path={route.path} query={route.query} />
    {:else if route.path.startsWith('/workflows')}
      <Workflows path={route.path} />
    {:else if route.path.startsWith('/metrics') || route.path === '/usage' || route.path === '/traces'}
      <Observe path={route.path} />
    {:else if route.path === '/hub' || route.path.startsWith('/admin')}
      <Govern path={route.path} />
    {:else}
      <h1 tabindex="-1">Page not found</h1>
      <Callout title="Unknown route"
        >This route does not exist in the Svelte demo.</Callout
      >
      <EmptyState title="Return to the screen map"
        ><ButtonLink href="#/map">Open screen map</ButtonLink></EmptyState
      >
    {/if}
  {/key}
</AppShell>
<CommandBar
  items={[...commands, ...serviceCommands]}
  open={palette}
  label="Search and commands"
  onclose={() => (palette = false)}
  oncommand={(item) => navigate(item.id)}
/>
