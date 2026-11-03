import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppShell } from '@microcks-deep-ink/registry/react/app-shell';
import { Callout } from '@microcks-deep-ink/registry/react/callout';
import { ThemeToggle } from '@microcks-deep-ink/registry/react/theme-toggle';
import { itemParams } from './_meta';

export default {
  title: 'Components/AppShell',
  parameters: itemParams(['app-shell', 'theme-toggle', 'icon', 'button'], 'Skip link, banner, main navigation (`aria-current="page"`) and `<main>`. Below 768px the navigation collapses behind a disclosure button. Pass `renderLink` to use your router.', { layout: 'fullscreen' }),
} satisfies Meta;

const NAV = [
  { id: 'cockpit', label: 'Cockpit', href: '#cockpit', icon: 'cockpit' as const },
  { id: 'apis', label: 'APIs & Services', href: '#apis', icon: 'apis' as const },
  { id: 'tests', label: 'Tests', href: '#tests', icon: 'tests' as const, badge: '2' },
  { id: 'sources', label: 'Sources', href: '#sources', icon: 'sources' as const },
  { id: 'hub', label: 'Hub', href: '#hub', icon: 'hub' as const },
];

export const Default: StoryObj = {
  render: () => (
    <div style={{ height: 420, transform: 'translateZ(0)' }}>
      <AppShell
        brand="Microcks"
        nav={NAV}
        activeId="apis"
        topbarActions={<ThemeToggle />}
        banner={<Callout tone="warning" title="DEMO">A design proposal, not an official Microcks release.</Callout>}
      >
        <h1 style={{ font: 'var(--type-section)', margin: 0 }}>APIs &amp; Services</h1>
        <p>Page content.</p>
      </AppShell>
    </div>
  ),
};
