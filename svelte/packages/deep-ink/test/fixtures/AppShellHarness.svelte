<!-- AppShell with an <h1> as children and, optionally, a renderLink snippet that marks router links. -->
<script lang="ts">
  import AppShell from '../../src/lib/app-shell/AppShell.svelte';
  import type { Snippet } from 'svelte';
  import type { ShellLinkProps, ShellNavItem } from '../../src/lib/app-shell/app-shell';

  let { nav, activeId, routerLinks = false, heading = 'APIs & Services' }: { nav: ShellNavItem[]; activeId: string; routerLinks?: boolean; heading?: string } = $props();
</script>

{#snippet link(item: ShellNavItem, props: ShellLinkProps, content: Snippet)}
  <a {...props} data-router-link={item.id}>{@render content()}</a>
{/snippet}

<AppShell brand="Microcks" {nav} {activeId} renderLink={routerLinks ? link : undefined}>
  <h1>{heading}</h1>
</AppShell>
