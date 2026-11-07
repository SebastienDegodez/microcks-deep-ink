import type { Ref } from 'react';
import type { CreateTestForm } from '@/application/testing';
import { Field, Input, Select, Switch } from '@microcks/deep-ink';
import type { Draft, UpdateDraft } from './draft';
import { FormSection } from './FormSection';

interface AuthSectionProps {
  secrets: CreateTestForm['secrets'];
  d: Draft;
  update: UpdateDraft;
  uid: string;
  clientSecretError: string | undefined;
  secretTouched: boolean;
  onSecretBlur: () => void;
  clientSecretRef: Ref<HTMLInputElement>;
}

export function AuthSection({ secrets, d, update, uid, clientSecretError, secretTouched, onSecretBlur, clientSecretRef }: AuthSectionProps) {
  return (
    <FormSection step="04" title="Authentication" hint="Optional · to reach a secured endpoint">
      <div className="tc-auth">
        <Field label="Secret" help="Credentials or CA certificate managed in Administration › Secrets.">
          {(control) => (
            <Select {...control} className="tc-mono-select" value={d.secret} onChange={(e) => update({ secret: e.target.value })}>
              <option value="">None</option>
              {secrets.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="tc-oauth-toggle" role="group" aria-labelledby={`${uid}-oauth-label`}>
          <span id={`${uid}-oauth-label`} className="label">
            OAuth2
          </span>
          <Switch label="Client credentials grant" aria-describedby={`${uid}-oauth-help`} checked={d.oauth} onChange={(checked) => update({ oauth: checked })} />
          <p className="help" id={`${uid}-oauth-help`}>
            Microcks fetches a token before each request. <span className="demo-mono">openid</span> is always included in scopes.
          </p>
        </div>
      </div>
      {d.oauth ? (
        <div className="tc-oauth">
          <div className="tc-wide">
            <Field label="Token URI">{(control) => <Input {...control} mono className="tc-link-input" spellCheck={false} value={d.tokenUri} onChange={(e) => update({ tokenUri: e.target.value })} />}</Field>
          </div>
          <Field label="Client Id">{(control) => <Input {...control} mono spellCheck={false} value={d.clientId} onChange={(e) => update({ clientId: e.target.value })} />}</Field>
          <Field label="Client Secret" required error={secretTouched ? clientSecretError : undefined}>
            {(control) => (
              <Input
                {...control}
                aria-invalid={clientSecretError ? true : undefined}
                onBlur={onSecretBlur}
                ref={clientSecretRef}
                type="password"
                mono
                placeholder="Required"
                autoComplete="off"
                value={d.clientSecret}
                onChange={(e) => update({ clientSecret: e.target.value })}
              />
            )}
          </Field>
          <div className="tc-wide">
            <Field
              label={
                <>
                  Scopes <span className="tc-label-hint">space-separated</span>
                </>
              }
            >
              {(control) => <Input {...control} mono spellCheck={false} value={d.scopes} onChange={(e) => update({ scopes: e.target.value })} />}
            </Field>
          </div>
        </div>
      ) : null}
    </FormSection>
  );
}
