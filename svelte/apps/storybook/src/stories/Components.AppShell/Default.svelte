<script lang="ts">
  import { AppShell } from '@microcks/deep-ink';
  import { Callout } from '@microcks/deep-ink';
  import { ThemeToggle } from '@microcks/deep-ink';
  const NAV = [
  { id: 'cockpit', label: 'Cockpit', href: '#cockpit', icon: 'cockpit' as const },
  { id: 'apis', label: 'APIs & Services', href: '#apis', icon: 'apis' as const },
  { id: 'tests', label: 'Tests', href: '#tests', icon: 'tests' as const, badge: '2' },
  { id: 'sources', label: 'Sources', href: '#sources', icon: 'sources' as const },
  { id: 'hub', label: 'Hub', href: '#hub', icon: 'hub' as const },
];
</script>

<div style="height:420px;transform:translateZ(0)"><AppShell brand="Microcks" nav={NAV} activeId="apis">{#snippet topbarActions()}<ThemeToggle />{/snippet}{#snippet banner()}<Callout tone="warning" title="DEMO">A design proposal, not an official Microcks release.</Callout>{/snippet}<h1 style="font:var(--type-section);margin:0">APIs &amp; Services</h1><p>Page content.</p></AppShell></div>
