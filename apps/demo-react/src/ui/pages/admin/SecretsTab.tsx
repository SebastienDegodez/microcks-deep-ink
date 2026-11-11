import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import type { SecretSummary } from '@/domain/shared';
import {
  SECRET_KIND_HINT,
  SECRET_KIND_LABEL,
  secretCredentials,
  secretFormHint,
  validateSecretForm,
  type SecretFormKind,
} from '@/domain/govern';
import { useClock, useReturnFocus, useUseCases, type QueryResult } from '@/ui/app';
import { Button, Field, Icon, Input, Textarea, Segmented, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { plural, type Notify } from './notify';
import '@microcks/demo-styles/pages/admin/secrets.css';

const KINDS: SecretFormKind[] = ['basic', 'token', 'oauth2', 'ca'];
const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Keeps each "••••••••" mask on one line. */
function maskNoWrap(text: string) {
  return text.split(/(•+)/).map((part, i) => (part.startsWith('•') ? <span key={i} className="ad-nowrap">{part}</span> : part));
}

interface FormState {
  mode: 'new' | 'edit';
  /** Secret id in edit mode. */
  id?: string;
  name: string;
  description: string;
  kind: SecretFormKind;
  user: string;
  secret: string;
  tokenUrl: string;
  scopes: string;
  show: boolean;
}

const EMPTY: FormState = { mode: 'new', name: '', description: '', kind: 'basic', user: '', secret: '', tokenUrl: '', scopes: '', show: false };

export function SecretsTab({ secrets, notify }: { secrets: QueryResult<SecretSummary[]>; notify: Notify }) {
  const uc = useUseCases();
  const clock = useClock();
  const [form, setForm] = useState<FormState | null>(null);
  const [confirming, setConfirming] = useState('');
  // Focus after the next render: a removed control must not drop focus to the page body.
  const { focusLater } = useReturnFocus();
  const setFocusId = (id: string) => focusLater(() => document.getElementById(id));

  if (secrets.status === 'error') return <ErrorBlock error={secrets.error} what="Secrets" onRetry={secrets.reload} />;
  if (!secrets.data) return <LoadingBlock label="secrets" />;
  const list = secrets.data;

  const updated = (s: SecretSummary) => {
    const at = new Date(s.updatedAt ?? s.createdAt);
    return clock.now().getTime() - at.getTime() < 60_000 ? 'Just now' : DATE.format(at);
  };
  const remove = async (s: SecretSummary) => {
    const at = list.findIndex((x) => x.id === s.id);
    const next = list[at + 1] ?? list[at - 1];
    await uc.govern.deleteSecret(s.id);
    setFocusId(next ? `ad-del-${next.id}` : 'ad-secrets-title');
    setConfirming('');
    if (form?.id === s.id) setForm(null);
    notify(`Secret ${s.name} deleted.`);
    secrets.reload();
  };
  const closeForm = () => {
    setFocusId(form?.mode === 'edit' && form.id ? `ad-edit-${form.id}` : 'ad-new-secret');
    setForm(null);
  };
  const edit = (s: SecretSummary) => {
    setConfirming('');
    setForm({ ...EMPTY, mode: 'edit', id: s.id, name: s.name, description: s.description ?? '', kind: s.kind });
  };

  return (
    <SplitPane mainWidth="560px" sideWidth="360px" sideMax="none" className="ad-secrets">
      <SplitPaneMain as="section" className="ad-secrets-list" aria-labelledby="ad-secrets-title">
        <div className="ad-section-head ad-section-head-center">
          <div className="ad-section-title">
            <h2 id="ad-secrets-title" tabIndex={-1}>Authentication secrets</h2>
            <p>Credentials for Git repositories, remote endpoints and brokers. Users only see a Secret’s name and description.</p>
          </div>
          {form ? null : (
            <Button id="ad-new-secret" variant="primary" icon="plus" onClick={() => { setConfirming(''); setForm({ ...EMPTY }); }}>New secret</Button>
          )}
        </div>
        <div className="table-wrap ad-secrets-table">
          <table className="table">
            <caption className="sr-only">Secrets. Values are never shown.</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Credentials</th>
                <th scope="col">Used by</th>
                <th scope="col">Updated</th>
                <th scope="col" data-align="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const used = s.usedBy ?? 0;
                return (
                  <Fragment key={s.id}>
                  <tr data-selected={form?.id === s.id ? '' : undefined} data-confirming={confirming === s.id ? '' : undefined}>
                    <th scope="row">
                      <span className="ad-secret-name">
                        <Icon name="key" size={16} className="ad-secret-icon" />
                        <span className="ad-secret-text">
                          <span className="ad-secret-id">{s.name}</span>
                          <span className="ad-secret-desc">{s.description}</span>
                        </span>
                      </span>
                    </th>
                    <td><span className="ad-secret-type">{SECRET_KIND_LABEL[s.kind]}</span></td>
                    <td className="ad-secret-detail">{maskNoWrap(s.detail ?? s.masked)}</td>
                    <td className="ad-secret-used" data-unused={used === 0 ? '' : undefined}>{used === 0 ? 'unused' : plural(used, 'importer')}</td>
                    <td className="ad-secret-updated">{updated(s)}</td>
                    <td data-align="end">
                      <span className="ad-secret-actions">
                        <button type="button" id={`ad-edit-${s.id}`} className="ad-text-button" aria-label={`Edit secret ${s.name}`} onClick={() => edit(s)}>Edit</button>
                        <button type="button" id={`ad-del-${s.id}`} className="ad-danger-button" aria-label={`Delete secret ${s.name}`} aria-expanded={confirming === s.id} onClick={() => setConfirming(s.id)}>Delete</button>
                      </span>
                    </td>
                  </tr>
                  {confirming === s.id ? (
                    <tr className="ad-confirm-row">
                      <td colSpan={6}>
                        <div role="alert" className="ad-confirm">
                          <Icon name="warning" size={14} className="ad-confirm-icon" />
                          <span className="ad-confirm-text">
                            Delete {s.name}? {used ? `${plural(used, 'importer')} still reference it and will fail on next run.` : 'No importer references it.'}
                          </span>
                          <button type="button" className="ad-small-button" onClick={() => { setConfirming(''); setFocusId(`ad-del-${s.id}`); }}>Cancel</button>
                          <button type="button" className="ad-small-button" data-danger="" onClick={() => remove(s)}>Delete secret</button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </SplitPaneMain>
      {form ? (
        <SplitPaneSide>
          <SecretForm
            key={form.id ?? 'new'}
            initial={form}
            names={list.map((s) => s.name)}
            onCancel={closeForm}
            onSaved={(message) => {
              closeForm();
              notify(message);
              secrets.reload();
            }}
          />
        </SplitPaneSide>
      ) : null}
    </SplitPane>
  );
}

function SecretForm({ initial, names, onCancel, onSaved }: { initial: FormState; names: string[]; onCancel: () => void; onSaved: (message: string) => void }) {
  const uc = useUseCases();
  const [f, setF] = useState(initial);
  const sectionRef = useRef<HTMLElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  });
  // The form opens with focus on its first field (Description when editing: the name is fixed).
  useEffect(() => {
    firstRef.current?.focus();
  }, []);
  // Escape closes the form, as a dialog would. A DOM listener: the section itself is not a control.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelRef.current();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);
  const editing = f.mode === 'edit';
  const set = (patch: Partial<FormState>) => setF((x) => ({ ...x, ...patch }));
  const hint = secretFormHint(validateSecretForm(f, names, editing));
  const title = editing ? `Edit secret ${f.name}` : 'New secret';
  const keep = editing ? '•••••• unchanged' : undefined;
  const pw = f.show ? 'text' : 'password';
  const showButton = (
    <button type="button" className="ad-show-button" aria-pressed={f.show} onClick={() => set({ show: !f.show })}>{f.show ? 'Hide' : 'Show'}</button>
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (hint) return;
    const detail = f.secret || f.user || !editing ? secretCredentials(f) : undefined;
    const input = { kind: f.kind, description: f.description || undefined, value: f.secret, detail };
    if (editing && f.id) {
      await uc.govern.updateSecret(f.id, input);
      onSaved(`Secret ${f.name} updated.`);
    } else {
      await uc.govern.createSecret({ ...input, name: f.name, description: f.description || 'No description' });
      onSaved(`Secret ${f.name} created. Reference it from an importer or a test.`);
    }
  };

  return (
    <section ref={sectionRef} className="ad-secret-form" aria-labelledby="ad-secret-form-title">
      <div className="ad-secret-form-head">
        <h2 id="ad-secret-form-title">{title}</h2>
        <button type="button" className="ad-close-button" aria-label="Close form" onClick={onCancel}>
          <Icon name="close" size={13} />
        </button>
      </div>
      <form className="ad-form" onSubmit={submit} noValidate>
        {editing ? (
          <div className="ad-readonly">
            <span className="label">Name <span className="ad-label-note">· cannot be changed, importers reference it</span></span>
            <span className="ad-readonly-value">{f.name}</span>
          </div>
        ) : (
          <Field label="Name">
            {(c) => <Input {...c} ref={firstRef} mono autoComplete="off" spellCheck={false} placeholder="gitlab-bakery" aria-describedby={hint && hint !== 'Credential required' ? 'ad-secret-hint' : undefined} value={f.name} onChange={(e) => set({ name: e.target.value })} />}
          </Field>
        )}
        <Field label={<>Description <span className="ad-label-note">· visible to every user</span></>}>
          {(c) => <Input {...c} ref={editing ? firstRef : undefined} autoComplete="off" placeholder="What this secret gives access to" value={f.description} onChange={(e) => set({ description: e.target.value })} />}
        </Field>
        <div className="field">
          <span className="label">Type</span>
          <Segmented
            label="Type"
            variant="joined"
            className="ad-type"
            options={KINDS.map((k) => ({ id: k, label: SECRET_KIND_LABEL[k] }))}
            value={f.kind}
            onChange={(k) => set({ kind: k as SecretFormKind })}
          />
          <p className="help">{SECRET_KIND_HINT[f.kind]}</p>
        </div>

        {f.kind === 'basic' ? (
          <>
            <Field label="Username">
              {(c) => <Input {...c} mono autoComplete="off" placeholder={keep} value={f.user} onChange={(e) => set({ user: e.target.value })} />}
            </Field>
            <Field label="Password">
              {(c) => (
                <span className="ad-secret-input">
                  <Input {...c} className="ad-secret-control" mono type={pw} autoComplete="new-password" placeholder={keep} value={f.secret} onChange={(e) => set({ secret: e.target.value })} />
                  {showButton}
                </span>
              )}
            </Field>
          </>
        ) : null}
        {f.kind === 'token' ? (
          <>
            <Field label="Token">
              {(c) => (
                <span className="ad-secret-input">
                  <Input {...c} className="ad-secret-control" mono type={pw} autoComplete="off" placeholder={keep} value={f.secret} onChange={(e) => set({ secret: e.target.value })} />
                  {showButton}
                </span>
              )}
            </Field>
            <Field label={<>Token header <span className="ad-label-note">· optional</span></>}>
              {(c) => <Input {...c} mono autoComplete="off" placeholder="Authorization: Bearer by default" value={f.user} onChange={(e) => set({ user: e.target.value })} />}
            </Field>
          </>
        ) : null}
        {f.kind === 'oauth2' ? (
          <>
            <Field label="Token endpoint">
              {(c) => <Input {...c} mono type="url" autoComplete="off" placeholder="https://keycloak.local:8180/realms/bakery/protocol/openid-connect/token" value={f.tokenUrl} onChange={(e) => set({ tokenUrl: e.target.value })} />}
            </Field>
            <div className="ad-form-row">
              <Field label="Client ID" className="ad-row-field">
                {(c) => <Input {...c} mono autoComplete="off" placeholder={keep} value={f.user} onChange={(e) => set({ user: e.target.value })} />}
              </Field>
              <Field label="Scopes" className="ad-row-field">
                {(c) => <Input {...c} mono autoComplete="off" placeholder="pastry:read" value={f.scopes} onChange={(e) => set({ scopes: e.target.value })} />}
              </Field>
            </div>
            <Field label="Client secret">
              {(c) => (
                <span className="ad-secret-input">
                  <Input {...c} className="ad-secret-control" mono type={pw} autoComplete="off" placeholder={keep} value={f.secret} onChange={(e) => set({ secret: e.target.value })} />
                  {showButton}
                </span>
              )}
            </Field>
          </>
        ) : null}
        {f.kind === 'ca' ? (
          <Field label={<>CA certificate <span className="ad-label-note">· PEM, chain allowed</span></>}>
            {(c) => (
              <Textarea
                {...c}
                mono
                rows={5}
                placeholder={'-----BEGIN CERTIFICATE-----\nMIIDdzCCAl+gAwIBAgIE…\n-----END CERTIFICATE-----'}
                value={f.secret}
                onChange={(e) => set({ secret: e.target.value })}
              />
            )}
          </Field>
        ) : null}

        <div className="ad-lock-note ad-lock-note-sm">
          <Icon name="lock" size={14} className="ad-lock-icon" />
          <span>Values are stored in the Microcks database and never shown again. Importers and tests reference the Secret by its name.</span>
        </div>
        <div className="ad-form-footer">
          {hint ? <span className="ad-form-hint" id="ad-secret-hint">{hint}</span> : null}
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={Boolean(hint)} aria-describedby={hint ? 'ad-secret-hint' : undefined}>
            {editing ? 'Save changes' : 'Create secret'}
          </Button>
        </div>
      </form>
    </section>
  );
}
