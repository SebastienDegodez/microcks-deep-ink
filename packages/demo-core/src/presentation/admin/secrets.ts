import { secretCredentials, type SecretFormKind } from '../../domain/govern/index.js';
import type { SecretSummary } from '../../domain/shared/index.js';
import { plural } from './notify.js';

/** Types of the form's Type choice, in order. */
export const KINDS: SecretFormKind[] = ['basic', 'token', 'oauth2', 'ca'];
/** Date of the Updated column: "Oct 21, 2026". */
export const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** Values of the secret form. */
export interface FormState {
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

/** An empty creation form. */
export const EMPTY: FormState = { mode: 'new', name: '', description: '', kind: 'basic', user: '', secret: '', tokenUrl: '', scopes: '', show: false };

/** The edit form of a secret. */
export const editForm = (s: SecretSummary): FormState => ({ ...EMPTY, mode: 'edit', id: s.id, name: s.name, description: s.description ?? '', kind: s.kind });

/** A credentials text split around its "••••" masks, each mask a part of its own. */
export const maskParts = (text: string) => text.split(/(•+)/);

/** Whether a part of `maskParts` is a mask. */
export const isMask = (part: string) => part.startsWith('•');

/** Updated column: "Just now" within a minute, else the date. */
export function updatedLabel(s: SecretSummary, now: Date): string {
  const at = new Date(s.updatedAt ?? s.createdAt);
  return now.getTime() - at.getTime() < 60_000 ? 'Just now' : DATE.format(at);
}

/** Used by column: "unused" or "2 importers". */
export const usedLabel = (used: number) => (used === 0 ? 'unused' : plural(used, 'importer'));

/** End of the delete confirmation, after "Delete name? ". */
export const confirmMessage = (used: number) => (used ? `${plural(used, 'importer')} still reference it and will fail on next run.` : 'No importer references it.');

/** Secret that takes the focus after a delete: the next row, else the previous one. */
export function nextAfterDelete(list: SecretSummary[], id: string): SecretSummary | undefined {
  const at = list.findIndex((x) => x.id === id);
  return list[at + 1] ?? list[at - 1];
}

/** Title of the form. */
export const formTitle = (f: FormState) => (f.mode === 'edit' ? `Edit secret ${f.name}` : 'New secret');

/** Placeholder of a credential field: a stored value is kept when editing. */
export const keepPlaceholder = (editing: boolean) => (editing ? '•••••• unchanged' : undefined);

/** Placeholder of the CA certificate. */
export const CA_PLACEHOLDER = '-----BEGIN CERTIFICATE-----\nMIIDdzCCAl+gAwIBAgIE…\n-----END CERTIFICATE-----';

/** What the form saves, without the name: an empty credential keeps the stored detail when editing. */
export function secretInput(f: FormState, editing: boolean) {
  const detail = f.secret || f.user || !editing ? secretCredentials(f) : undefined;
  return { kind: f.kind, description: f.description || undefined, value: f.secret, detail };
}

/** Status message after an edit. */
export const updatedMessage = (name: string) => `Secret ${name} updated.`;

/** Status message after a creation. */
export const createdMessage = (name: string) => `Secret ${name} created. Reference it from an importer or a test.`;

/** Status message after a delete. */
export const deletedMessage = (name: string) => `Secret ${name} deleted.`;
