<script lang="ts">
  import '@microcks/demo-styles/pages/admin/users.css';
  import type { AdminGroup, AdminUser, Role } from '@microcks/demo-core/domain/govern';
  import { Chip, DataTable, type DataTableColumn, FilterSearch, Select } from '@microcks/deep-ink';
  import { useUseCases, type QueryResult } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { plural, type Notify } from './notify';
  import { NO_GROUP, ROLES, ROLE_CHIPS, filterUsers, noUserText, roleChangedMessage, roleChipTone, roleChipVariant, roleCount, roleSelectTitle } from './users';

  interface Props {
    users: QueryResult<AdminUser[]>;
    groups: AdminGroup[];
    notify: Notify;
    onchanged: () => void;
  }

  let { users, groups, notify, onchanged }: Props = $props();
  const uc = useUseCases();
  let query = $state('');

  const all = $derived(users.data ?? []);
  const rows = $derived(filterUsers(all, query));
  const count = (r: Role) => roleCount(all, r);
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? id;

  const change = async (u: AdminUser, role: Role) => {
    await uc.govern.setRole(u.id, role);
    notify(roleChangedMessage(u, role));
    onchanged();
  };

  const columns: DataTableColumn<AdminUser>[] = [
    { key: 'user', header: 'User', render: userCell },
    { key: 'email', header: 'Email', render: emailCell },
    { key: 'roles', header: 'Roles', render: rolesCell },
    { key: 'groups', header: 'Manager groups', render: groupsCell },
    { key: 'role', header: 'Change role', render: roleCell },
  ];
</script>

{#snippet userCell(u: AdminUser)}<span class="ad-user"
    ><span class="ad-avatar" aria-hidden="true">{u.initials}</span><span class="ad-user-text"
      ><span class="ad-user-name">{u.name}{#if u.self}<span class="ad-user-you">(you)</span>{/if}</span><span class="ad-user-id">{u.id}</span></span
    ></span
  >{/snippet}

{#snippet emailCell(u: AdminUser)}<span class="ad-user-email">{u.email}</span>{/snippet}

{#snippet rolesCell(u: AdminUser)}<span class="ad-pills"
    >{#each ROLE_CHIPS[u.role] as r (r)}<Chip size="sm" tone={roleChipTone(r)} variant={roleChipVariant(r)}>{r}</Chip>{/each}</span
  >{/snippet}

{#snippet groupsCell(u: AdminUser)}{#if u.groups.length > 0}<span class="ad-pills"
      >{#each u.groups as g (g)}<Chip size="sm">{groupName(g)}</Chip>{/each}</span
    >{:else}<span class="ad-note">{NO_GROUP[u.role]}</span>{/if}{/snippet}

{#snippet roleCell(u: AdminUser)}<span class="ad-role-cell"
    ><Select
      aria-label={`Role of ${u.name}`}
      size="sm"
      value={u.role}
      disabled={u.self}
      title={roleSelectTitle(u)}
      onchange={(e) => change(u, e.currentTarget.value as Role)}
      >{#each ROLES as r (r.id)}<option value={r.id}>{r.label}</option>{/each}</Select
    >{#if u.self}<span class="ad-note-sm">Your own role is locked</span>{/if}</span
  >{/snippet}

{#if users.status === 'error'}<ErrorBlock error={users.error} what="Users" onretry={users.reload} />{:else if !users.data}<LoadingBlock
    label="users"
  />{:else}<div class="ad-tab" aria-busy={users.status === 'loading'}
    ><div class="ad-toolbar"
      ><FilterSearch
        class="ad-search"
        label="Filter users"
        placeholder="Filter by name, username or email…"
        autocomplete="off"
        value={query}
        oninput={(e) => (query = e.currentTarget.value)}
      /><span class="ad-meta">{plural(all.length, 'user')}<!----> · <!---->{count('admin')}<!----> admin · <!---->{plural(count('manager'), 'manager')}</span
      ></div
    ><DataTable class="ad-users" caption="Users and roles" captionHidden {columns} {rows} rowKey="id" emptyText={noUserText(query)} /><div class="ad-legend"
      ><span><span class="ad-legend-key">user</span> browses APIs, runs tests</span><span
        ><span class="ad-legend-key">manager</span> imports contracts, edits mocks of its groups</span
      ><span><span class="ad-legend-key">admin</span> everything, including this page</span><span class="ad-legend-full"
        >Users are created and deleted in the Keycloak realm <span class="ad-legend-key">microcks</span>. Role changes apply to the <span
          class="ad-legend-key">microcks-app</span
        > client roles immediately.</span
      ></div
    ></div
  >{/if}
