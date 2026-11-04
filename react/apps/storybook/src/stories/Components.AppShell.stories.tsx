import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { AppShell } from '@microcks/deep-ink';
import { Callout } from '@microcks/deep-ink';
import { ThemeToggle } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Components/AppShell',
  component: AppShell,
  parameters: itemParams(['app-shell', 'theme-toggle', 'icon', 'button'], 'Skip link, banner, main navigation (`aria-current="page"`) and `<main>`. Below 768px the navigation collapses behind a disclosure button. Pass `renderLink` to use your router.', { layout: 'fullscreen' }),
} satisfies Meta<typeof AppShell>;

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

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof AppShell> = {
  parameters: { layout: 'fullscreen' },
  args: {
    brand: 'Microcks',
    nav: [
      { id: 'cockpit', label: 'Cockpit', href: '#cockpit', icon: 'cockpit' },
      { id: 'apis', label: 'APIs & Services', href: '#apis', icon: 'apis' },
      { id: 'tests', label: 'Tests', href: '#tests', icon: 'tests', badge: '2' },
    ],
    activeId: 'apis',
    skipLinkLabel: 'Skip to content',
    navLabel: 'Main',
    children: <><h1 style={{ font: 'var(--type-section)', margin: 0 }}>APIs &amp; Services</h1><p>Page content.</p></>,
  },
  decorators: [(Story) => <div style={{ height: 420, transform: 'translateZ(0)' }}><Story /></div>],
};

/** `navLabel` and `skipLinkLabel` translate the landmark names; `topbarCenter` fills the middle of the top bar; `renderLink` plugs a router link. */
export const Customised: StoryObj = {
  name: 'Labels, centre slot and router link',
  render: () => (
    <div style={{ height: 360, transform: 'translateZ(0)' }}>
      <AppShell
        brand="Microcks"
        nav={NAV.slice(0, 3)}
        activeId="cockpit"
        navLabel="Primary"
        skipLinkLabel="Skip to the page"
        topbarCenter={<span className="sb-note">Search lives here</span>}
        renderLink={(item, props) => <a {...props} data-route={item.id} />}
      >
        <h1 style={{ font: 'var(--type-section)', margin: 0 }}>Cockpit</h1>
      </AppShell>
    </div>
  ),
};
