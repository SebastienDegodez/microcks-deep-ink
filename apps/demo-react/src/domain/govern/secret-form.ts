export type SecretFormKind = 'basic' | 'token' | 'oauth2';

export interface SecretFormValues {
  name: string;
  kind: SecretFormKind;
  description: string;
  /** Password, token or client secret. */
  secret: string;
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
};

export const SECRET_KIND_LABEL: Record<SecretFormKind, string> = { basic: 'Basic', token: 'Token', oauth2: 'OAuth2' };

export function validateSecretForm(values: SecretFormValues, existingNames: readonly string[]): SecretFormErrors {
  const errors: SecretFormErrors = {};
  if (!values.name) errors.name = 'A name is required.';
  else if (!SECRET_NAME_PATTERN.test(values.name)) errors.name = 'Use lowercase letters, digits and dashes (2 to 63 characters).';
  else if (existingNames.includes(values.name)) errors.name = 'This name already exists.';
  if (!values.secret) errors.secret = 'A credential is required.';
  return errors;
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
