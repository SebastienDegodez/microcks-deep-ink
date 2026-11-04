import { useRef } from 'react';
import type { AdminGroup, AdminUser } from '@/domain/govern';
import { membershipChanges, membershipKey } from '@/domain/govern';
import { useReturnFocus, useUseCases, type QueryResult } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import { plural, type Notify } from './notify';
import './groups.css';

interface GroupsTabProps {
  users: QueryResult<AdminUser[]>;
  groups: QueryResult<AdminGroup[]>;
  /** `groupId|userId` keys, or null when nothing changed. Owned by the page so it survives a tab change. */
  draft: string[] | null;
  setDraft: (draft: string[] | null) => void;
  notify: Notify;
  onChanged: () => void;
}

/** Roles × groups matrix: one column per manager, one row per value of the master label `domain`. */
export function GroupsTab({ users, groups, draft, setDraft, notify, onChanged }: GroupsTabProps) {
  const uc = useUseCases();
  // Discard and Apply remove the pending bar (and the focused button): focus moves to the section heading.
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Apply and Discard remove the draft controls: focus goes back to the section heading.
  const { focusLater } = useReturnFocus();
  if (groups.status === 'error') return <ErrorBlock error={groups.error} what="Groups" onRetry={groups.reload} />;
  if (users.status === 'error') return <ErrorBlock error={users.error} what="Users" onRetry={users.reload} />;
  if (!groups.data || !users.data) return <LoadingBlock label="groups" />;

  const all = groups.data;
  const managers = users.data.filter((u) => u.role === 'manager');
  const saved = all.flatMap((g) => g.members.map((m) => membershipKey(g.id, m)));
  const current = draft ?? saved;
  const changes = membershipChanges(saved, current);
  const pathOf = (groupId: string) => all.find((g) => g.id === groupId)?.name ?? groupId;
  const coverage = (g: AdminGroup) => managers.filter((m) => current.includes(membershipKey(g.id, m.id))).length;
  const uncovered = all.filter((g) => coverage(g) === 0).length;

  const toggle = (key: string) => {
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    const same = next.length === saved.length && next.every((k) => saved.includes(k));
    setDraft(same ? null : next);
  };
  const apply = async () => {
    const touched = new Set(changes.map((c) => c.groupId));
    for (const g of all) {
      if (!touched.has(g.id)) continue;
      await uc.govern.saveMembers(g.id, current.filter((k) => k.startsWith(`${g.id}|`)).map((k) => k.split('|')[1] ?? ''));
    }
    notify(`${plural(changes.length, 'membership change')} applied in Keycloak realm microcks.`);
    setDraft(null);
    focusLater(headingRef);
    onChanged();
  };

  return (
    <div className="ad-tab">
      <div className="ad-section-head">
        <div className="ad-section-title">
          <h2 ref={headingRef} tabIndex={-1}>Manager groups</h2>
          <p>
            One group per value of the master label <span className="ad-mono">domain</span>. A member manages the Services carrying that value. Click a cell to add or remove a membership, then apply.
          </p>
        </div>
        <span className="ad-meta">
          {plural(all.length, 'group')} × {plural(managers.length, 'manager')}
          {uncovered ? ` · ${uncovered} without manager` : ''}
        </span>
      </div>

      <div className="ad-card">
        <div className="ad-scroll">
          <table className="ad-matrix" style={{ minWidth: `${230 + managers.length * 92 + 152}px` }}>
            <caption className="sr-only">Group memberships: groups by managers</caption>
            <colgroup>
              <col style={{ width: `${(1.6 / (1.6 + managers.length)) * 87 + 1.4}%` }} />
              {managers.map((m) => <col key={m.id} />)}
              <col className="ad-matrix-coverage" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col">Group</th>
                {managers.map((m) => (
                  <th key={m.id} scope="col" className="ad-matrix-head">
                    <span className="ad-avatar ad-avatar-sm" aria-hidden="true">{m.initials}</span>
                    <span className="ad-matrix-id" title={m.name}>{m.id}</span>
                  </th>
                ))}
                <th scope="col" className="ad-matrix-end">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {all.map((g) => {
                const n = coverage(g);
                const count = g.services?.length ?? 0;
                return (
                  <tr key={g.id}>
                    <th scope="row">
                      <span className="ad-matrix-path">{g.name}</span>
                      <span className="ad-matrix-sub">domain={g.id} · {plural(count, 'Service')}</span>
                    </th>
                    {managers.map((m) => {
                      const key = membershipKey(g.id, m.id);
                      const was = saved.includes(key);
                      const now = current.includes(key);
                      const state = now && !was ? 'add' : was && !now ? 'remove' : now ? 'member' : 'empty';
                      const label = `${m.name} in ${g.name}, ${now ? 'member' : 'not a member'}${state === 'add' ? ', to be added' : state === 'remove' ? ', to be removed' : ''}`;
                      const title = state === 'add' ? 'To be added' : state === 'remove' ? 'To be removed' : now ? 'Member' : 'Not a member';
                      return (
                        <td key={m.id} className="ad-matrix-cell">
                          <button type="button" className="ad-cell" data-state={state} aria-pressed={now} aria-label={label} title={title} onClick={() => toggle(key)}>
                            {now ? <Icon name="check" size={16} /> : state === 'remove' ? <Icon name="dash" size={14} /> : <span className="ad-cell-dot" aria-hidden="true" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="ad-matrix-end">
                      <span className="ad-coverage" data-ok={n > 0 ? '' : undefined}>
                        <Icon name={n > 0 ? 'check' : 'warning'} size={13} />
                        {n > 0 ? plural(n, 'manager') : 'no manager'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {changes.length > 0 ? (
          <div className="ad-pending" role="group" aria-label="Pending membership changes">
            <span className="ad-pending-count">
              <Icon name="clock-sm" size={14} />
              {plural(changes.length, 'pending change')}
            </span>
            <span className="ad-pending-list">
              {changes.map((c) => (c.kind === 'add' ? `+ ${c.userId} → ${pathOf(c.groupId)}` : `− ${c.userId} ✕ ${pathOf(c.groupId)}`)).join('   ')}
            </span>
            <Button onClick={() => { setDraft(null); focusLater(headingRef); }}>Discard</Button>
            <Button variant="primary" onClick={apply}>Apply to Keycloak</Button>
          </div>
        ) : null}
      </div>

      <div className="ad-legend ad-legend-sm">
        <span className="ad-swatch-item"><span className="ad-swatch" data-state="member" aria-hidden="true" />member</span>
        <span className="ad-swatch-item"><span className="ad-swatch" data-state="add" aria-hidden="true" />to be added</span>
        <span className="ad-swatch-item"><span className="ad-swatch" data-state="remove" aria-hidden="true" />to be removed</span>
        <span>Only users with the <span className="ad-legend-key">manager</span> role appear as columns. Admins manage every Service.</span>
      </div>
    </div>
  );
}
