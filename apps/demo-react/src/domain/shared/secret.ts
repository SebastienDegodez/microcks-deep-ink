export type SecretKind = 'token' | 'basic' | 'oauth2' | 'ca';

/** A named secret. The value is never exposed: pages only see the masked form. */
export interface SecretSummary {
  id: string;
  name: string;
  kind: SecretKind;
  description?: string;
  /** Masked value, e.g. "••••••••3f2a". */
  masked: string;
  /** What the credentials are, never their value: "header PRIVATE-TOKEN · token ••••••••". */
  detail?: string;
  /** Number of importers that reference the secret by name. */
  usedBy?: number;
  createdAt: string;
  /** Last change; `createdAt` when never edited. */
  updatedAt?: string;
}
