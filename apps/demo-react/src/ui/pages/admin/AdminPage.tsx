import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { membershipChanges } from '@/domain/govern';
import { PageHeader, usePageTitle, useQuery, useUseCases } from '@/ui/app';
import { ApiBadge, Icon, TabPanel, Tabs } from '@microcks/deep-ink';
import { ConfigurationTab } from './ConfigurationTab';
import { GroupsTab } from './GroupsTab';
import { SecretsTab } from './SecretsTab';
import { SnapshotsTab } from './SnapshotsTab';
import { UsersTab } from './UsersTab';
import type { Notify } from './notify';
import { TOAST_MS, alertLabel, savedMemberships, tabOf, type Tab } from './tabs';
import '@microcks/demo-styles/pages/admin/admin.css';

export default function AdminPage() {
  const { tab: tabParam } = useParams();
  usePageTitle('Administration · Microcks');
  const navigate = useNavigate();
  const uc = useUseCases();
  const tab: Tab = tabOf(tabParam);

  const users = useQuery(() => uc.govern.listUsers(), []);
  const groups = useQuery(() => uc.govern.listGroups(), []);
  const secrets = useQuery(() => uc.govern.listSecrets(), []);

  // The membership draft lives here: it survives a tab change and its size is shown on the Groups tab.
  const [draft, setDraft] = useState<string[] | null>(null);
  const saved = savedMemberships(groups.data ?? []);
  const pending = membershipChanges(saved, draft ?? saved).length;

  const [toast, setToast] = useState('');
  const toastRef = useRef<HTMLDivElement>(null);
  // Closing the toast removes its × button: focus goes back to the selected tab instead of the page body.
  const hideToast = useCallback(() => {
    const hadFocus = toastRef.current?.contains(document.activeElement) ?? false;
    setToast('');
    if (hadFocus) document.getElementById(`admin-tab-${tab}`)?.focus();
  }, [tab]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);
  const notify: Notify = useCallback((message) => setToast(message), []);

  const reloadUsers = () => {
    users.reload();
    groups.reload();
  };

  return (
    <>
      <PageHeader
        title="Administration"
        description="Assign Microcks roles and manager groups, keep the Secrets used by importers and tests, and export or restore repository Snapshots."
        descriptionTone="secondary"
        descriptionWidth={760}
        align="start"
        actions={
          <>
            <ApiBadge label="keycloak" value="realm microcks" status="success" />
            <ApiBadge label="tenancy" value="label domain" status="info" />
          </>
        }
      />
      <Tabs
        label="Administration sections"
        idPrefix="admin"
        value={tab}
        onChange={(id) => navigate(`/admin/${id}`)}
        items={[
          { id: 'users', label: 'Users', count: users.data?.length },
          { id: 'groups', label: 'Groups', count: groups.data?.length, alert: pending || undefined, alertLabel: alertLabel(pending) },
          { id: 'secrets', label: 'Secrets', count: secrets.data?.length },
          { id: 'snapshots', label: 'Snapshots' },
          { id: 'configuration', label: 'Configuration' },
        ]}
      >
        <div role="status" className="ad-toast-region" ref={toastRef}>
          {toast ? (
            <div className="ad-toast">
              <Icon name="check" size={15} className="ad-toast-icon" />
              <span className="ad-toast-text">{toast}</span>
              <button type="button" className="ad-toast-close" aria-label="Dismiss message" onClick={hideToast}>
                <Icon name="close" size={12} />
              </button>
            </div>
          ) : null}
        </div>
        <TabPanel id={tab} value={tab} idPrefix="admin" className="ad-panel">
          {tab === 'users' ? <UsersTab users={users} groups={groups.data ?? []} notify={notify} onChanged={reloadUsers} /> : null}
          {tab === 'groups' ? <GroupsTab users={users} groups={groups} draft={draft} setDraft={setDraft} notify={notify} onChanged={reloadUsers} /> : null}
          {tab === 'secrets' ? <SecretsTab secrets={secrets} notify={notify} /> : null}
          {tab === 'snapshots' ? <SnapshotsTab notify={notify} /> : null}
          {tab === 'configuration' ? <ConfigurationTab /> : null}
        </TabPanel>
      </Tabs>
    </>
  );
}
