<script lang="ts">
  import type { CreateTestForm } from '@microcks/demo-core/application/testing';
  import { Field, Input, Select, Switch } from '@microcks/deep-ink';
  import type { Draft, UpdateDraft } from './draft';
  import FormSection from './FormSection.svelte';

  interface Props {
    secrets: CreateTestForm['secrets'];
    d: Draft;
    update: UpdateDraft;
    uid: string;
    clientSecretError: string | undefined;
    secretTouched: boolean;
    onsecretblur: () => void;
    clientSecretEl?: HTMLInputElement;
  }

  /** "04 Authentication": the Secret, and the OAuth2 client credentials grant with its fields. */
  let { secrets, d, update, uid, clientSecretError, secretTouched, onsecretblur, clientSecretEl = $bindable() }: Props = $props();
</script>

{#snippet scopesLabel()}Scopes <span class="tc-label-hint">space-separated</span>{/snippet}

<FormSection step="04" title="Authentication" hint="Optional · to reach a secured endpoint"
  ><div class="tc-auth"
    ><Field label="Secret" help="Credentials or CA certificate managed in Administration › Secrets."
      >{#snippet children(c)}<Select {...c} class="tc-mono-select" value={d.secret} onchange={(e) => update({ secret: e.currentTarget.value })}
          ><option value="">None</option>{#each secrets as s (s.id)}<option value={s.name}>{s.name}</option>{/each}</Select
        >{/snippet}</Field
    ><div class="tc-oauth-toggle" role="group" aria-labelledby={`${uid}-oauth-label`}
      ><span id={`${uid}-oauth-label`} class="label">OAuth2</span><Switch
        label="Client credentials grant"
        aria-describedby={`${uid}-oauth-help`}
        checked={d.oauth}
        oncheckedchange={(checked) => update({ oauth: checked })}
      /><p class="help" id={`${uid}-oauth-help`}
        >Microcks fetches a token before each request. <span class="demo-mono">openid</span> is always included in scopes.</p
      ></div
    ></div
  >{#if d.oauth}<div class="tc-oauth"
      ><div class="tc-wide"
        ><Field label="Token URI"
          >{#snippet children(c)}<Input
              {...c}
              mono
              class="tc-link-input"
              spellcheck={false}
              value={d.tokenUri}
              oninput={(e) => update({ tokenUri: e.currentTarget.value })}
            />{/snippet}</Field
        ></div
      ><Field label="Client Id"
        >{#snippet children(c)}<Input {...c} mono spellcheck={false} value={d.clientId} oninput={(e) => update({ clientId: e.currentTarget.value })} />{/snippet}</Field
      ><Field label="Client Secret" required error={secretTouched ? clientSecretError : undefined}
        >{#snippet children(c)}<Input
            {...c}
            aria-invalid={clientSecretError ? true : undefined}
            onblur={onsecretblur}
            bind:element={clientSecretEl}
            type="password"
            mono
            placeholder="Required"
            autocomplete="off"
            value={d.clientSecret}
            oninput={(e) => update({ clientSecret: e.currentTarget.value })}
          />{/snippet}</Field
      ><div class="tc-wide"
        ><Field label={scopesLabel}
          >{#snippet children(c)}<Input {...c} mono spellcheck={false} value={d.scopes} oninput={(e) => update({ scopes: e.currentTarget.value })} />{/snippet}</Field
        ></div
      ></div
    >{/if}</FormSection
>
