<script lang="ts">
  import { AppShell } from '@microcks/deep-ink';
  const NAV = [
  { id: 'cockpit', label: 'Cockpit', href: '#cockpit', icon: 'cockpit' as const },
  { id: 'apis', label: 'APIs & Services', href: '#apis', icon: 'apis' as const },
  { id: 'tests', label: 'Tests', href: '#tests', icon: 'tests' as const, badge: '2' },
  { id: 'sources', label: 'Sources', href: '#sources', icon: 'sources' as const },
  { id: 'hub', label: 'Hub', href: '#hub', icon: 'hub' as const },
];
</script>

<div style="height:360px;transform:translateZ(0)"><AppShell brand="Microcks" nav={NAV.slice(0, 3)} activeId="cockpit" navLabel="Primary" skipLinkLabel="Skip to the page">{#snippet topbarCenter()}<span class="sb-note">Search lives here</span>{/snippet}{#snippet renderLink(item, props, content)}<a {...props} data-route={item.id}>{@render content()}</a>{/snippet}<h1 style="font:var(--type-section);margin:0">Cockpit</h1></AppShell></div>
