export type SecretFormKind = 'basic' | 'token' | 'oauth2' | 'ca';

export interface SecretFormValues {
  name: string;
  kind: SecretFormKind;
  description: string;
  /** Password, token, client secret or PEM certificate. */
  secret: string;
  /** Basic username, token header or OAuth2 client id. */
  user?: string;
  /** OAuth2 token endpoint. */
  tokenUrl?: string;
  /** OAuth2 scopes. */
  scopes?: string;
}

export interface SecretFormErrors {
  name?: string;
  secret?: string;
}

export const SECRET_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;

export const SECRET_KIND_HINT: Record<SecretFormKind, string> = {
  basic: 'HTTP Basic authentication with a username and a password.',
  token: 'Bearer token, or a custom header such as PRIVATE-TOKEN.',
  oauth2: 'OAuth2 client credentials: Microcks fetches a token before each call.',
  ca: 'Custom certificate or chain to trust a private TLS endpoint.',
};

export const SECRET_KIND_LABEL: Record<SecretFormKind, string> = { basic: 'Basic', token: 'Token', oauth2: 'OAuth2', ca: 'CA cert' };

/**
 * Validates the secret form. When `editing`, the name is fixed and an empty credential keeps the stored one.
 */
export function validateSecretForm(values: SecretFormValues, existingNames: readonly string[], editing = false): SecretFormErrors {
  const errors: SecretFormErrors = {};
  if (!editing) {
    if (!values.name) errors.name = 'Name required';
    else if (!SECRET_NAME_PATTERN.test(values.name)) errors.name = 'Lowercase letters, digits and dashes';
    else if (existingNames.includes(values.name)) errors.name = 'This name already exists';
  }
  if (!editing && !values.secret) errors.secret = 'Credential required';
  return errors;
}

/** First problem of the form, shown in its footer; empty when it can be saved. */
export function secretFormHint(errors: SecretFormErrors): string {
  return errors.name ?? errors.secret ?? '';
}

/** What the credentials are, never their value. */
export function secretCredentials(values: Pick<SecretFormValues, 'kind' | 'secret' | 'user' | 'scopes'>): string {
  const mask = values.secret ? '••••••••' : '';
  switch (values.kind) {
    case 'basic':
      return `user ${values.user || '—'} · password ${mask}`;
    case 'token':
      return `${values.user ? `header ${values.user}` : 'Authorization: Bearer'} · token ${mask}`;
    case 'oauth2':
      return `client ${values.user || '—'} · secret ${mask}${values.scopes ? ` · scope ${values.scopes}` : ''}`;
    case 'ca': {
      const n = (values.secret.match(/-----BEGIN CERTIFICATE-----/g) ?? []).length || 1;
      return `PEM · ${n} ${n === 1 ? 'certificate' : 'certificates'}`;
    }
  }
}

/** Group membership draft: `groupId|userId` keys. */
export function membershipKey(groupId: string, userId: string): string {
  return `${groupId}|${userId}`;
}

export interface MembershipChange {
  groupId: string;
  userId: string;
  kind: 'add' | 'remove';
}

/** Differences between the saved memberships and the draft, added first. */
export function membershipChanges(saved: readonly string[], draft: readonly string[]): MembershipChange[] {
  const split = (key: string) => {
    const [groupId = '', userId = ''] = key.split('|');
    return { groupId, userId };
  };
  return [
    ...draft.filter((k) => !saved.includes(k)).map((k) => ({ ...split(k), kind: 'add' as const })),
    ...saved.filter((k) => !draft.includes(k)).map((k) => ({ ...split(k), kind: 'remove' as const })),
  ];
}
