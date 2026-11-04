import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { TabsComponent, TabPanelComponent } from '@microcks-deep-ink/registry/angular/tabs';
import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Components/Tabs',
  decorators: [moduleMetadata({ imports: [TabsComponent, TabPanelComponent] })],
  parameters: itemParams(['tabs'], "WAI-ARIA tabs. Use them to switch views of one page, not to navigate between pages. The count is read with the label (\"Operations, 4\")."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: { tabs: SERVICE_TABS, v: 'operations' },
    template: `
      <mk-tabs label="Service sections" [items]="tabs" [(value)]="v" activation="automatic">
        @for (t of tabs; track t.id) {
          <div mkTabPanel [tab]="t.id"><p style="margin:0">Content of the {{ t.label }} tab.</p></div>
        }
      </mk-tabs>
    `,
  }),
};

export const ManualActivation: StoryObj = {
  name: "Manual activation",
  parameters: { docs: { description: { story: "Arrow keys only move focus; Enter or Space selects. Use it when a panel is expensive to load." } } },
  render: () => ({
    props: { tabs: SERVICE_TABS, v: 'operations' },
    template: `
      <mk-tabs label="Service sections" [items]="tabs" [(value)]="v" activation="manual">
        @for (t of tabs; track t.id) {
          <div mkTabPanel [tab]="t.id"><p style="margin:0">Content of the {{ t.label }} tab.</p></div>
        }
      </mk-tabs>
    `,
  }),
};

export const WithDisabledTab: StoryObj = {
  name: "Disabled tab",
  render: () => ({
    props: { tabs: SERVICE_TABS.map((t) => (t.id === 'contracts' ? { ...t, disabled: true } : t)), v: 'operations' },
    template: `
      <mk-tabs label="Service sections" [items]="tabs" [(value)]="v" activation="automatic">
        @for (t of tabs; track t.id) {
          <div mkTabPanel [tab]="t.id"><p style="margin:0">Content of the {{ t.label }} tab.</p></div>
        }
      </mk-tabs>
    `,
  }),
};

export const LiveAndAlert: StoryObj = {
  name: "Live dot and warning count",
  parameters: { docs: { description: { story: "A live dot before the label (read \"Tasks, live\") and a warning pill (read \"Users, 2 pending changes\")." } } },
  render: () => ({
    props: {
      tabs: [
        { id: 'tasks', label: 'Tasks', count: 5, live: true },
        { id: 'users', label: 'Users', count: 12, alert: 2, alertLabel: 'pending changes' },
        { id: 'secrets', label: 'Secrets', count: 3 },
      ],
      v: 'tasks',
    },
    template: `
      <mk-tabs label="Sections" [items]="tabs" [(value)]="v" activation="automatic">
        @for (t of tabs; track t.id) {
          <div mkTabPanel [tab]="t.id"><p style="margin:0">Content of the {{ t.label }} tab.</p></div>
        }
      </mk-tabs>
    `,
  }),
};

export const CardWithIcons: StoryObj = {
  name: "Card variant, icons and hints (Import)",
  render: () => ({
    props: {
      tabs: [
        { id: 'file', label: 'Upload', hint: 'one-off file', icon: 'document' },
        { id: 'url', label: 'URL', hint: 'fetched on demand', icon: 'link' },
        { id: 'git', label: 'Git repository', hint: 'kept in sync', icon: 'git-branch' },
        { id: 'direct', label: 'Direct API', hint: 'no contract', icon: 'zap' },
      ],
      v: 'file',
    },
    template: `
      <div style="border: 1px solid var(--border); border-radius: 8px; background: var(--canvas)">
        <mk-tabs label="Source type" variant="card" [items]="tabs" [(value)]="v">
          @for (t of tabs; track t.id) {
            <div mkTabPanel [tab]="t.id"><p style="margin:0; padding: 0 20px 20px">Content of the {{ t.label }} tab.</p></div>
          }
        </mk-tabs>
      </div>
    `,
  }),
};
