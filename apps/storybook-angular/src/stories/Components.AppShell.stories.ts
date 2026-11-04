import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { AppShellComponent } from '@microcks-deep-ink/registry/angular/app-shell';
import { ThemeToggleComponent } from '@microcks-deep-ink/registry/angular/theme-toggle';
import { CalloutComponent, CalloutActionsDirective } from '@microcks-deep-ink/registry/angular/callout';
import { argTypesFor, itemParams } from './_meta';

const NAV = [
  { id: 'cockpit', label: 'Cockpit', href: '#cockpit', icon: 'cockpit' as const },
  { id: 'apis', label: 'APIs & Services', href: '#apis', icon: 'apis' as const },
  { id: 'tests', label: 'Tests', href: '#tests', icon: 'tests' as const, badge: '2' },
  { id: 'sources', label: 'Sources', href: '#sources', icon: 'sources' as const },
  { id: 'hub', label: 'Hub', href: '#hub', icon: 'hub' as const },
];

const meta: Meta = {
  title: 'Components/AppShell',
  argTypes: argTypesFor('app-shell', ['AppShellComponent']),
  decorators: [moduleMetadata({ imports: [AppShellComponent, ThemeToggleComponent, CalloutComponent, CalloutActionsDirective] })],
  parameters: itemParams(['app-shell', 'theme-toggle', 'icon', 'button'], "Skip link, banner, main navigation (`aria-current=\"page\"`) and `<main>`. Below 768px the navigation collapses behind a disclosure button. Pass `linkTemplate` to use your router.", { layout: 'fullscreen' }),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { nav: NAV },
    template: `
      <div style="height:420px;transform:translateZ(0)">
        <mk-app-shell brand="Microcks" [nav]="nav" activeId="apis">
          <button mkShellActions mkThemeToggle></button>
          <mk-callout mkShellBanner tone="warning" title="DEMO">A design proposal, not an official Microcks release.</mk-callout>
          <h1 style="font:var(--type-section);margin:0">APIs &amp; Services</h1>
          <p>Page content.</p>
        </mk-app-shell>
      </div>
    `,
  }),
};
