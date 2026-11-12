import { useState } from 'react';
import type { AdminGroup, AdminUser, Role } from '@/domain/govern';
import { useUseCases, type QueryResult } from '@/ui/app';
import { Chip, FilterSearch, Select, DataTable, type DataTableColumn } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { plural, type Notify } from './notify';
import { NO_GROUP, ROLES, ROLE_CHIPS, filterUsers, noUserText, roleChangedMessage, roleChipTone, roleChipVariant, roleCount, roleSelectTitle } from './users';
import '@microcks/demo-styles/pages/admin/users.css';

export function UsersTab({ users, groups, notify, onChanged }: { users: QueryResult<AdminUser[]>; groups: AdminGroup[]; notify: Notify; onChanged: () => void }) {
  const uc = useUseCases();
  const [query, setQuery] = useState('');

  if (users.status === 'error') return <ErrorBlock error={users.error} what="Users" onRetry={users.reload} />;
  if (!users.data) return <LoadingBlock label="users" />;

  const all = users.data;
  const rows = filterUsers(all, query);
  const count = (r: Role) => roleCount(all, r);
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? id;

  const change = async (u: AdminUser, role: Role) => {
    await uc.govern.setRole(u.id, role);
    notify(roleChangedMessage(u, role));
    onChanged();
  };

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <span className="ad-user">
          <span className="ad-avatar" aria-hidden="true">{u.initials}</span>
          <span className="ad-user-text">
            <span className="ad-user-name">
              {u.name}
              {u.self ? <span className="ad-user-you">(you)</span> : null}
            </span>
            <span className="ad-user-id">{u.id}</span>
          </span>
        </span>
      ),
    },
    { key: 'email', header: 'Email', render: (u) => <span className="ad-user-email">{u.email}</span> },
    {
      key: 'roles',
      header: 'Roles',
      render: (u) => (
        <span className="ad-pills">
          {ROLE_CHIPS[u.role].map((r) => (
            <Chip key={r} size="sm" tone={roleChipTone(r)} variant={roleChipVariant(r)}>{r}</Chip>
          ))}
        </span>
      ),
    },
    {
      key: 'groups',
      header: 'Manager groups',
      render: (u) =>
        u.groups.length > 0 ? (
          <span className="ad-pills">
            {u.groups.map((g) => (
              <Chip key={g} size="sm">{groupName(g)}</Chip>
            ))}
          </span>
        ) : (
          <span className="ad-note">{NO_GROUP[u.role]}</span>
        ),
    },
    {
      key: 'role',
      header: 'Change role',
      render: (u) => (
        <span className="ad-role-cell">
          <Select
            aria-label={`Role of ${u.name}`}
            size="sm"
            value={u.role}
            disabled={u.self}
            title={roleSelectTitle(u)}
            onChange={(e) => change(u, e.target.value as Role)}
          >
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </Select>
          {u.self ? <span className="ad-note-sm">Your own role is locked</span> : null}
        </span>
      ),
    },
  ];

  return (
    <div className="ad-tab" aria-busy={users.status === 'loading'}>
      <div className="ad-toolbar">
        <FilterSearch className="ad-search" label="Filter users" placeholder="Filter by name, username or email…" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
        <span className="ad-meta">{plural(all.length, 'user')} · {count('admin')} admin · {plural(count('manager'), 'manager')}</span>
      </div>
      <DataTable
        className="ad-users"
        caption="Users and roles"
        captionHidden
        columns={columns}
        rows={rows}
        rowKey="id"
        emptyText={noUserText(query)}
      />
      <div className="ad-legend">
        <span><span className="ad-legend-key">user</span> browses APIs, runs tests</span>
        <span><span className="ad-legend-key">manager</span> imports contracts, edits mocks of its groups</span>
        <span><span className="ad-legend-key">admin</span> everything, including this page</span>
        <span className="ad-legend-full">
          Users are created and deleted in the Keycloak realm <span className="ad-legend-key">microcks</span>. Role changes apply to the <span className="ad-legend-key">microcks-app</span> client roles immediately.
        </span>
      </div>
    </div>
  );
}
