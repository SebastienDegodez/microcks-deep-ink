import { useState, type FormEvent } from 'react';
import type { SecretSummary } from '@/domain/shared';
import { SECRET_KIND_HINT, SECRET_KIND_LABEL, validateSecretForm, type SecretFormKind } from '@/domain/govern';
import { useUseCases, type QueryResult } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Dialog } from '@/ui/components/ui/dialog';
import { Field } from '@/ui/components/ui/field';
import { Input } from '@/ui/components/ui/input';
import { Panel } from '@/ui/components/ui/panel';
import { Select } from '@/ui/components/ui/select';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import type { Notify } from './notify';

export function SecretsTab({ secrets, notify }: { secrets: QueryResult<SecretSummary[]>; notify: Notify }) {
  const uc = useUseCases();
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
