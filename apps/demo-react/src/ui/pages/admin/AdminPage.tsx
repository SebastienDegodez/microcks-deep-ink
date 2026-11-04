import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { SecretSummary } from '@/domain/shared';
import {
  SECRET_KIND_HINT,
  SECRET_KIND_LABEL,
  membershipChanges,
  membershipKey,
  validateSecretForm,
  type AdminGroup,
  type AdminUser,
  type Role,
  type SecretFormKind,
  type SnapshotImportPreviewItem,
} from '@/domain/govern';
import { PageHeader, usePageTitle, useQuery, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Dialog } from '@/ui/components/ui/dialog';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { Panel } from '@/ui/components/ui/panel';
import { Select } from '@/ui/components/ui/select';
import { Switch } from '@/ui/components/ui/switch';
import { TabPanel, Tabs } from '@/ui/components/ui/tabs';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import './admin.css';

const TABS = ['users', 'groups', 'secrets', 'snapshots', 'configuration'] as const;
type Tab = (typeof TABS)[number];
const ROLES: { id: Role; label: string }[] = [
  { id: 'admin', label: 'Administrator' },
  { id: 'manager', label: 'Manager' },
  { id: 'user', label: 'User' },
];

export default function AdminPage() {
  const { tab: tabParam } = useParams();
  usePageTitle('Administration · Microcks');
  const navigate = useNavigate();
  const uc = useUseCases();
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as Tab) : 'users';
  const requests = useQuery(() => uc.govern.listRequests(), []);
  const [toast, setToast] = useState('');
  const pending = requests.data?.length ?? 0;

  return (
    <>
      <PageHeader title="Administration" />
      <div className="ad-toast">
        {toast ? (
          <Callout tone="success" live="polite" role="status" actions={<Button variant="ghost" onClick={() => setToast('')}>Dismiss</Button>}>
            <p>{toast}</p>
          </Callout>
        ) : null}
      </div>
      <Tabs
        label="Administration"
        idPrefix="admin"
        value={tab}
        onChange={(id) => navigate(`/admin/${id}`)}
        items={[
          { id: 'users', label: 'Users' },
          { id: 'groups', label: pending > 0 ? `Groups (${pending} pending)` : 'Groups' },
          { id: 'secrets', label: 'Secrets' },
          { id: 'snapshots', label: 'Snapshots' },
          { id: 'configuration', label: 'Configuration' },
        ]}
      >
        <TabPanel id={tab} value={tab} idPrefix="admin">
          {tab === 'users' ? <Users notify={setToast} /> : null}
          {tab === 'groups' ? <Groups notify={setToast} requests={requests.data?.length ?? 0} onChanged={requests.reload} /> : null}
          {tab === 'secrets' ? <Secrets notify={setToast} /> : null}
          {tab === 'snapshots' ? <Snapshots notify={setToast} /> : null}
          {tab === 'configuration' ? <Configuration notify={setToast} /> : null}
        </TabPanel>
      </Tabs>
    </>
  );
}

type Notify = (message: string) => void;

function Users({ notify }: { notify: Notify }) {
  const uc = useUseCases();
  const users = useQuery(() => uc.govern.listUsers(), []);
  const groups = useQuery(() => uc.govern.listGroups(), []);
  const change = async (u: AdminUser, role: Role) => {
    await uc.govern.setRole(u.id, role);
    notify(`${u.name} is now ${ROLES.find((r) => r.id === role)?.label.toLowerCase()}.`);
    users.reload();
  };
  if (users.status === 'error') return <ErrorBlock error={users.error} what="Users" onRetry={users.reload} />;
  if (!users.data) return <LoadingBlock label="users" />;
  return (
    <Panel title="Users" aria-busy={users.status === 'loading'}>
      <div className="demo-scroll">
        <table className="ad-table">
          <caption className="sr-only">Users and their roles</caption>
          <thead><tr><th scope="col">User</th><th scope="col">Email</th><th scope="col">Groups</th><th scope="col">Role</th></tr></thead>
          <tbody>
            {users.data.map((u) => (
              <tr key={u.id}>
                <th scope="row"><span className="ad-avatar" aria-hidden="true">{u.initials}</span>{u.name}{u.self ? ' (you)' : ''}</th>
                <td>{u.email}</td>
                <td>{u.groups.map((g) => groups.data?.find((x) => x.id === g)?.name ?? g).join(', ') || 'None'}</td>
                <td>
                  <Select aria-label={`Role of ${u.name}`} size="sm" value={u.role} disabled={u.self} onChange={(e) => change(u, e.target.value as Role)}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </Select>
                  {u.self ? <span className="sr-only"> Your own role cannot be changed.</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Groups({ notify, requests, onChanged }: { notify: Notify; requests: number; onChanged: () => void }) {
  const uc = useUseCases();
  const users = useQuery(() => uc.govern.listUsers(), []);
  const groups = useQuery(() => uc.govern.listGroups(), []);
  const reqs = useQuery(() => uc.govern.listRequests(), []);
  const [draft, setDraft] = useState<string[] | null>(null);
  const saved = (groups.data ?? []).flatMap((g) => g.members.map((m) => membershipKey(g.id, m)));
  const current = draft ?? saved;
  const changes = membershipChanges(saved, current);

  if (groups.status === 'error') return <ErrorBlock error={groups.error} what="Groups" onRetry={groups.reload} />;
  if (!groups.data || !users.data) return <LoadingBlock label="groups" />;

  const toggle = (key: string, on: boolean) => setDraft(on ? [...current, key] : current.filter((k) => k !== key));
  const save = async () => {
    const touched = new Set(changes.map((c) => c.groupId));
    for (const g of groups.data ?? []) {
      if (!touched.has(g.id)) continue;
      await uc.govern.saveMembers(g.id, current.filter((k) => k.startsWith(`${g.id}|`)).map((k) => k.split('|')[1] ?? ''));
    }
    notify(`Membership saved: ${changes.length} ${changes.length === 1 ? 'change' : 'changes'}.`);
    setDraft(null);
    groups.reload();
    users.reload();
  };
  const approve = async (id: string) => {
    await uc.govern.approveRequest(id);
    notify('Request approved.');
    reqs.reload();
    groups.reload();
    onChanged();
  };

  return (
    <div className="stack">
      {requests > 0 ? (
        <Panel title={`${reqs.data?.length ?? requests} pending requests`.replace(/^1 pending requests$/, '1 pending request')}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }} className="stack">
            {(reqs.data ?? []).map((r) => {
              const user = users.data?.find((u) => u.id === r.userId);
              const group = groups.data?.find((g) => g.id === r.groupId);
              return (
                <li key={r.id} className="demo-actions-row">
                  <span>{user?.name ?? r.userId} asks to join <strong>{group?.name ?? r.groupId}</strong></span>
                  <Button size="sm" onClick={() => approve(r.id)} aria-label={`Approve ${user?.name ?? r.userId} in ${group?.name ?? r.groupId}`}>Approve</Button>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}
      <div className="ad-groups">
        {groups.data.map((g: AdminGroup) => (
          <Panel key={g.id} title={g.name}>
            <fieldset className="ad-members">
              <legend>Members of {g.name}{g.pendingRequests > 0 ? ` (${g.pendingRequests} pending)` : ''}</legend>
              {users.data?.map((u) => (
                <Checkbox
                  key={u.id}
                  label={`${u.name} · ${u.email}`}
                  checked={current.includes(membershipKey(g.id, u.id))}
                  onChange={(e) => toggle(membershipKey(g.id, u.id), e.target.checked)}
                />
              ))}
            </fieldset>
            {g.services && g.services.length > 0 ? <p className="demo-muted">Governs: {g.services.join(', ')}</p> : null}
          </Panel>
        ))}
      </div>
      <div className="demo-actions-row" role="group" aria-label="Membership changes">
        <Button variant="primary" disabled={changes.length === 0} onClick={save}>Save changes</Button>
        <Button disabled={changes.length === 0} onClick={() => setDraft(null)}>Cancel</Button>
        <span role="status" className="demo-muted">{changes.length === 0 ? 'No unsaved change.' : `${changes.length} unsaved ${changes.length === 1 ? 'change' : 'changes'}.`}</span>
      </div>
    </div>
  );
}

function Secrets({ notify }: { notify: Notify }) {
  const uc = useUseCases();
  const secrets = useQuery(() => uc.govern.listSecrets(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', kind: 'basic' as SecretFormKind, description: '', secret: '' });
  const [attempted, setAttempted] = useState(false);
  const errors = validateSecretForm(form, (secrets.data ?? []).map((s) => s.name));
  const show = (k: 'name' | 'secret') => (attempted ? errors[k] : undefined);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (errors.name || errors.secret) return;
    await uc.govern.createSecret({ name: form.name, kind: form.kind as SecretSummary['kind'], description: form.description || undefined, value: form.secret });
    notify(`Secret ${form.name} created.`);
    setOpen(false);
    setForm({ name: '', kind: 'basic', description: '', secret: '' });
    setAttempted(false);
    secrets.reload();
  };
  const remove = async (s: SecretSummary) => {
    await uc.govern.deleteSecret(s.id);
    notify(`Secret ${s.name} deleted.`);
    secrets.reload();
  };

  if (secrets.status === 'error') return <ErrorBlock error={secrets.error} what="Secrets" onRetry={secrets.reload} />;
  if (!secrets.data) return <LoadingBlock label="secrets" />;
  return (
    <Panel title="Secrets" actions={<Button icon="plus" onClick={() => setOpen(true)}>Create secret</Button>}>
      <div className="demo-scroll">
        <table className="ad-table">
          <caption className="sr-only">Secrets. Values are masked.</caption>
          <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Value</th><th scope="col">Description</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {secrets.data.map((s) => (
              <tr key={s.id}>
                <th scope="row"><span className="demo-mono">{s.name}</span></th>
                <td>{SECRET_KIND_LABEL[s.kind as SecretFormKind] ?? s.kind}</td>
                <td className="demo-mono">{s.masked}</td>
                <td>{s.description ?? ''}</td>
                <td><Button size="sm" variant="ghost" icon="trash" onClick={() => remove(s)} aria-label={`Delete secret ${s.name}`}>Delete</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog
        open={open}
        onClose={() => { setOpen(false); setAttempted(false); }}
        title="Create a secret"
        description="Secrets are referenced by name in tests and importers. The value is never shown again."
        footer={
          <>
            <Button onClick={() => { setOpen(false); setAttempted(false); }}>Cancel</Button>
            <Button variant="primary" type="submit" form="ad-secret-form">Create secret</Button>
          </>
        }
      >
        <form id="ad-secret-form" className="ad-form" onSubmit={submit} noValidate>
          <Field label="Name" required error={show('name')} help="Lowercase letters, digits and dashes.">
            {(c) => <Input {...c} mono data-autofocus="" autoComplete="off" spellCheck={false} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
          </Field>
          <Field label="Type" help={SECRET_KIND_HINT[form.kind]}>
            {(c) => (
              <Select {...c} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as SecretFormKind })}>
                {(Object.keys(SECRET_KIND_LABEL) as SecretFormKind[]).map((k) => <option key={k} value={k}>{SECRET_KIND_LABEL[k]}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Description">
            {(c) => <Input {...c} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}
          </Field>
          <Field label={form.kind === 'basic' ? 'Password' : form.kind === 'token' ? 'Token' : 'Client secret'} required error={show('secret')}>
            {(c) => <Input {...c} type="password" autoComplete="new-password" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} />}
          </Field>
        </form>
      </Dialog>
    </Panel>
  );
}

function Snapshots({ notify }: { notify: Notify }) {
  const uc = useUseCases();
  const services = useQuery(() => uc.catalog.listServices(), []);
  const [selected, setSelected] = useState<string[]>([]);
  const [exported, setExported] = useState<{ fileName: string; json: string; operations?: number } | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<SnapshotImportPreviewItem[] | null>(null);

  const doExport = async () => {
    const snap = await uc.govern.exportSnapshot(selected);
    setExported(snap);
    notify(`Snapshot ${snap.fileName} ready.`);
  };
  const pick = async (name: string) => {
    setFileName(name);
    setPreview(name ? await uc.govern.previewSnapshotImport(name) : null);
  };
  const doImport = async () => {
    const r = await uc.govern.importSnapshot(fileName);
    notify(`Imported ${fileName}: ${r.created} created, ${r.replaced} replaced.`);
    setPreview(null);
    setFileName('');
  };

  return (
    <div className="stack">
      <Panel title="Export">
        <div className="stack">
          <fieldset className="ad-members">
            <legend>Services to export</legend>
            {(services.data ?? []).map((s) => (
              <Checkbox
                key={s.id}
                label={`${s.name} ${s.version}`}
                checked={selected.includes(s.id)}
                onChange={(e) => setSelected(e.target.checked ? [...selected, s.id] : selected.filter((x) => x !== s.id))}
              />
            ))}
          </fieldset>
          <div className="demo-actions-row">
            <Button variant="primary" icon="upload" disabled={selected.length === 0} onClick={doExport}>Export snapshot</Button>
            <span className="demo-muted" role="status">{selected.length} {selected.length === 1 ? 'service' : 'services'} selected</span>
          </div>
          {exported ? (
            <div className="stack">
              <p>
                <strong className="demo-mono">{exported.fileName}</strong>
                {exported.operations ? ` · ${exported.operations} operations` : ''}
              </p>
              <CopyButton value={exported.json} label="Copy JSON" />
            </div>
          ) : null}
        </div>
      </Panel>
      <Panel title="Import">
        <div className="stack">
          <Field label="Snapshot file" help="Choose a JSON snapshot exported from another instance.">
            {(c) => <Input {...c} className="ad-file" type="file" accept=".json,application/json" onChange={(e) => pick(e.target.files?.[0]?.name ?? '')} />}
          </Field>
          <div>
            <Button onClick={() => pick('pastry-snapshot.json')}>Use the sample snapshot</Button>
          </div>
          {preview ? (
            <div className="stack">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{fileName}: what will happen</h3>
              <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
                {preview.map((p) => (
                  <li key={p.name}>
                    <strong>{p.kind === 'new' ? 'New' : 'Replace'}</strong> · {p.name} ({p.protocol}) · {p.effect}
                  </li>
                ))}
              </ul>
              <div><Button variant="primary" onClick={doImport}>Import snapshot</Button></div>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function Configuration({ notify }: { notify: Notify }) {
  const uc = useUseCases();
  const flags = useQuery(() => uc.govern.listFlags(), []);
  if (flags.status === 'error') return <ErrorBlock error={flags.error} what="Configuration" onRetry={flags.reload} />;
  if (!flags.data) return <LoadingBlock label="configuration" />;
  return (
    <Panel title="Feature flags">
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }} className="stack">
        {flags.data.map((f) => (
          <li key={f.id}>
            <Switch
              label={f.label}
              description={<>{f.description}{f.key ? <> <span className="demo-mono">{f.key}</span></> : null}{f.value ? <> · value <span className="demo-mono">{f.value}</span></> : null}</>}
              checked={f.enabled}
              onChange={async (on) => {
                await uc.govern.setFlag(f.id, on);
                notify(`${f.label} ${on ? 'enabled' : 'disabled'}.`);
                flags.reload();
              }}
            />
          </li>
        ))}
      </ul>
      <p className="demo-muted"><Icon name="info" size={14} /> Nothing is saved in this demo.</p>
    </Panel>
  );
}
