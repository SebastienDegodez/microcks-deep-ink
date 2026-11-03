export type SecretKind = 'token' | 'basic' | 'oauth2';

/** A named secret. The value is never exposed: pages only see the masked form. */
export interface SecretSummary {
  id: string;
  name: string;
  kind: SecretKind;
  description?: string;
  /** Masked value, e.g. "••••••••3f2a". */
  masked: string;
  createdAt: string;
}
