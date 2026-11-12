<script lang="ts">
  import { membershipChanges } from '@microcks/demo-core/domain/govern';
  import { ApiBadge, Icon, TabPanel, Tabs } from '@microcks/deep-ink';
  import { PageHeader, useNavigate, useParams, usePageTitle, useQuery, useUseCases } from '@/ui/app';
  import ConfigurationTab from './ConfigurationTab.svelte';
  import GroupsTab from './GroupsTab.svelte';
  import SecretsTab from './SecretsTab.svelte';
  import SnapshotsTab from './SnapshotsTab.svelte';
  import UsersTab from './UsersTab.svelte';
  import type { Notify } from './notify';
  import { TOAST_MS, alertLabel, savedMemberships, tabOf } from './tabs';
  import '@microcks/demo-styles/pages/admin/admin.css';

  /** `/admin/:tab?`: users and roles, manager groups, secrets, snapshots and the read-only configuration. */
  const params = useParams();
  usePageTitle('Administration · Microcks');
  const navigate = useNavigate();
  const uc = useUseCases();
  const tab = $derived(tabOf(params.tab));

  const users = useQuery(() => uc.govern.listUsers());
  const groups = useQuery(() => uc.govern.listGroups());
  const secrets = useQuery(() => uc.govern.listSecrets());

  // The membership draft lives here: it survives a tab change and its size is shown on the Groups tab.
  let draft = $state.raw<string[] | null>(null);
  const saved = $derived(savedMemberships(groups.data ?? []));
  const pending = $derived(membershipChanges(saved, draft ?? saved).length);

  let toast = $state('');
  let toastRegion = $state<HTMLDivElement>();
  // Closing the toast removes its × button: focus goes back to the selected tab instead of the page body.
  const hideToast = () => {
    const hadFocus = toastRegion?.contains(document.activeElement) ?? false;
    toast = '';
    if (hadFocus) document.getElementById(`admin-tab-${tab}`)?.focus();
  };
  $effect(() => {
    // The timer restarts when the tab changes, as the twin's `hideToast` depends on it.
    void tab;
    if (!toast) return;
    const timer = setTimeout(hideToast, TOAST_MS);
    return () => clearTimeout(timer);
  });
  const notify: Notify = (message) => (toast = message);

  const reloadUsers = () => {
    users.reload();
    groups.reload();
  };
</script>

{#snippet actions()}<ApiBadge label="keycloak" value="realm microcks" status="success" /><ApiBadge label="tenancy" value="label domain" status="info" />{/snippet}

<PageHeader
  title="Administration"
  description="Assign Microcks roles and manager groups, keep the Secrets used by importers and tests, and export or restore repository Snapshots."
  descriptionTone="secondary"
  descriptionWidth={760}
  align="start"
  {actions}
/><Tabs
  label="Administration sections"
  idPrefix="admin"
  value={tab}
  onchange={(id) => navigate(`/admin/${id}`)}
  items={[
    { id: 'users', label: 'Users', count: users.data?.length },
    { id: 'groups', label: 'Groups', count: groups.data?.length, alert: pending || undefined, alertLabel: alertLabel(pending) },
    { id: 'secrets', label: 'Secrets', count: secrets.data?.length },
    { id: 'snapshots', label: 'Snapshots' },
    { id: 'configuration', label: 'Configuration' },
  ]}
  ><div role="status" class="ad-toast-region" bind:this={toastRegion}
    >{#if toast}<div class="ad-toast"
        ><Icon name="check" size={15} class="ad-toast-icon" /><span class="ad-toast-text">{toast}</span><button
          type="button"
          class="ad-toast-close"
          aria-label="Dismiss message"
          onclick={hideToast}><Icon name="close" size={12} /></button
        ></div
      >{/if}</div
  ><TabPanel id={tab} value={tab} idPrefix="admin" class="ad-panel"
    >{#if tab === 'users'}<UsersTab {users} groups={groups.data ?? []} {notify} onchanged={reloadUsers} />{/if}{#if tab === 'groups'}<GroupsTab
        {users}
        {groups}
        bind:draft
        {notify}
        onchanged={reloadUsers}
      />{/if}{#if tab === 'secrets'}<SecretsTab {secrets} {notify} />{/if}{#if tab === 'snapshots'}<SnapshotsTab {notify} />{/if}{#if tab === 'configuration'}<ConfigurationTab
      />{/if}</TabPanel
  ></Tabs
>
