<script lang="ts">
  import { SECRET_KIND_HINT, SECRET_KIND_LABEL, secretFormHint, validateSecretForm, type SecretFormKind } from '@microcks/demo-core/domain/govern';
  import { Button, Field, Icon, Input, Segmented, Textarea } from '@microcks/deep-ink';
  import { untrack } from 'svelte';
  import { useUseCases } from '@/ui/app';
  import { CA_PLACEHOLDER, KINDS, createdMessage, formTitle, keepPlaceholder, secretInput, updatedMessage, type FormState } from './secrets';

  interface Props {
    initial: FormState;
    names: string[];
    oncancel: () => void;
    onsaved: (message: string) => void;
  }

  let { initial, names, oncancel, onsaved }: Props = $props();
  const uc = useUseCases();
  let f = $state.raw<FormState>(untrack(() => ({ ...initial })));
  let section = $state<HTMLElement>();
  let first = $state<HTMLInputElement>();
  // The form opens with focus on its first field (Description when editing: the name is fixed).
  $effect(() => {
    untrack(() => first?.focus());
  });
  // Escape closes the form, as a dialog would. A DOM listener: the section itself is not a control.
  $effect(() => {
    const el = section;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        oncancel();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  });
  const editing = $derived(f.mode === 'edit');
  const set = (patch: Partial<FormState>) => (f = { ...f, ...patch });
  const hint = $derived(secretFormHint(validateSecretForm(f, names, editing)));
  const title = $derived(formTitle(f));
  const keep = $derived(keepPlaceholder(editing));
  const pw = $derived(f.show ? 'text' : 'password');

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (hint) return;
    const form = f;
    const saved = onsaved;
    const input = secretInput(form, editing);
    if (editing && form.id) {
      await uc.govern.updateSecret(form.id, input);
      saved(updatedMessage(form.name));
    } else {
      await uc.govern.createSecret({ ...input, name: form.name, description: form.description || 'No description' });
      saved(createdMessage(form.name));
    }
  };
</script>

{#snippet showButton()}<button type="button" class="ad-show-button" aria-pressed={f.show} onclick={() => set({ show: !f.show })}
    >{f.show ? 'Hide' : 'Show'}</button
  >{/snippet}
{#snippet descLabel()}Description <span class="ad-label-note">· visible to every user</span>{/snippet}
{#snippet headerLabel()}Token header <span class="ad-label-note">· optional</span>{/snippet}
{#snippet caLabel()}CA certificate <span class="ad-label-note">· PEM, chain allowed</span>{/snippet}

<section bind:this={section} class="ad-secret-form" aria-labelledby="ad-secret-form-title"
  ><div class="ad-secret-form-head"
    ><h2 id="ad-secret-form-title">{title}</h2><button type="button" class="ad-close-button" aria-label="Close form" onclick={oncancel}
      ><Icon name="close" size={13} /></button
    ></div
  ><form class="ad-form" onsubmit={submit} novalidate
    >{#if editing}<div class="ad-readonly"
        ><span class="label">Name <span class="ad-label-note">· cannot be changed, importers reference it</span></span><span class="ad-readonly-value"
          >{f.name}</span
        ></div
      >{:else}<Field label="Name"
        >{#snippet children(c)}<Input
            {...c}
            bind:element={first}
            mono
            autocomplete="off"
            spellcheck={false}
            placeholder="gitlab-bakery"
            aria-describedby={hint && hint !== 'Credential required' ? 'ad-secret-hint' : undefined}
            value={f.name}
            oninput={(e) => set({ name: e.currentTarget.value })}
          />{/snippet}</Field
      >{/if}<Field label={descLabel}
      >{#snippet children(c)}{#if editing}<Input
            {...c}
            bind:element={first}
            autocomplete="off"
            placeholder="What this secret gives access to"
            value={f.description}
            oninput={(e) => set({ description: e.currentTarget.value })}
          />{:else}<Input
            {...c}
            autocomplete="off"
            placeholder="What this secret gives access to"
            value={f.description}
            oninput={(e) => set({ description: e.currentTarget.value })}
          />{/if}{/snippet}</Field
    ><div class="field"
      ><span class="label">Type</span><Segmented
        label="Type"
        variant="joined"
        class="ad-type"
        options={KINDS.map((k) => ({ id: k, label: SECRET_KIND_LABEL[k] }))}
        value={f.kind}
        onchange={(k) => set({ kind: k as SecretFormKind })}
      /><p class="help">{SECRET_KIND_HINT[f.kind]}</p></div
    >{#if f.kind === 'basic'}<Field label="Username"
        >{#snippet children(c)}<Input {...c} mono autocomplete="off" placeholder={keep} value={f.user} oninput={(e) => set({ user: e.currentTarget.value })} />{/snippet}</Field
      ><Field label="Password"
        >{#snippet children(c)}<span class="ad-secret-input"
            ><Input
              {...c}
              class="ad-secret-control"
              mono
              type={pw}
              autocomplete="new-password"
              placeholder={keep}
              value={f.secret}
              oninput={(e) => set({ secret: e.currentTarget.value })}
            />{@render showButton()}</span
          >{/snippet}</Field
      >{/if}{#if f.kind === 'token'}<Field label="Token"
        >{#snippet children(c)}<span class="ad-secret-input"
            ><Input
              {...c}
              class="ad-secret-control"
              mono
              type={pw}
              autocomplete="off"
              placeholder={keep}
              value={f.secret}
              oninput={(e) => set({ secret: e.currentTarget.value })}
            />{@render showButton()}</span
          >{/snippet}</Field
      ><Field label={headerLabel}
        >{#snippet children(c)}<Input
            {...c}
            mono
            autocomplete="off"
            placeholder="Authorization: Bearer by default"
            value={f.user}
            oninput={(e) => set({ user: e.currentTarget.value })}
          />{/snippet}</Field
      >{/if}{#if f.kind === 'oauth2'}<Field label="Token endpoint"
        >{#snippet children(c)}<Input
            {...c}
            mono
            type="url"
            autocomplete="off"
            placeholder="https://keycloak.local:8180/realms/bakery/protocol/openid-connect/token"
            value={f.tokenUrl}
            oninput={(e) => set({ tokenUrl: e.currentTarget.value })}
          />{/snippet}</Field
      ><div class="ad-form-row"
        ><Field label="Client ID" class="ad-row-field"
          >{#snippet children(c)}<Input {...c} mono autocomplete="off" placeholder={keep} value={f.user} oninput={(e) => set({ user: e.currentTarget.value })} />{/snippet}</Field
        ><Field label="Scopes" class="ad-row-field"
          >{#snippet children(c)}<Input
              {...c}
              mono
              autocomplete="off"
              placeholder="pastry:read"
              value={f.scopes}
              oninput={(e) => set({ scopes: e.currentTarget.value })}
            />{/snippet}</Field
        ></div
      ><Field label="Client secret"
        >{#snippet children(c)}<span class="ad-secret-input"
            ><Input
              {...c}
              class="ad-secret-control"
              mono
              type={pw}
              autocomplete="off"
              placeholder={keep}
              value={f.secret}
              oninput={(e) => set({ secret: e.currentTarget.value })}
            />{@render showButton()}</span
          >{/snippet}</Field
      >{/if}{#if f.kind === 'ca'}<Field label={caLabel}
        >{#snippet children(c)}<Textarea
            {...c}
            mono
            rows={5}
            placeholder={CA_PLACEHOLDER}
            value={f.secret}
            defaultValue={f.secret}
            oninput={(e) => set({ secret: e.currentTarget.value })}
          />{/snippet}</Field
      >{/if}<div class="ad-lock-note ad-lock-note-sm"
      ><Icon name="lock" size={14} class="ad-lock-icon" /><span
        >Values are stored in the Microcks database and never shown again. Importers and tests reference the Secret by its name.</span
      ></div
    ><div class="ad-form-footer"
      >{#if hint}<span class="ad-form-hint" id="ad-secret-hint">{hint}</span>{/if}<Button onclick={oncancel}>Cancel</Button><Button
        variant="primary"
        type="submit"
        disabled={Boolean(hint)}
        aria-describedby={hint ? 'ad-secret-hint' : undefined}>{editing ? 'Save changes' : 'Create secret'}</Button
      ></div
    ></form
  ></section
>
