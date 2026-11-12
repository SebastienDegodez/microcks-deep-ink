<script lang="ts">
  import '@microcks/demo-styles/pages/admin/secrets.css';
  import { SECRET_KIND_LABEL } from '@microcks/demo-core/domain/govern';
  import type { SecretSummary } from '@microcks/demo-core/domain/shared';
  import { Button, Icon, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
  import { useClock, useReturnFocus, useUseCases, type QueryResult } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import SecretForm from './SecretForm.svelte';
  import type { Notify } from './notify';
  import { EMPTY, confirmMessage, deletedMessage, editForm, isMask, maskParts, nextAfterDelete, updatedLabel, usedLabel, type FormState } from './secrets';

  interface Props {
    secrets: QueryResult<SecretSummary[]>;
    notify: Notify;
  }

  let { secrets, notify }: Props = $props();
  const uc = useUseCases();
  const clock = useClock();
  let form = $state.raw<FormState | null>(null);
  let confirming = $state('');
  // Focus after the next render: a removed control must not drop focus to the page body.
  const { focusLater } = useReturnFocus();
  const setFocusId = (id: string) => focusLater(() => document.getElementById(id));

  const list = $derived(secrets.data ?? []);
  // `maskNoWrap` keeps each "••••••••" mask on one line.

  const updated = (s: SecretSummary) => updatedLabel(s, clock.now());
  const remove = async (s: SecretSummary) => {
    const next = nextAfterDelete(list, s.id);
    const closesForm = form?.id === s.id;
    await uc.govern.deleteSecret(s.id);
    setFocusId(next ? `ad-del-${next.id}` : 'ad-secrets-title');
    confirming = '';
    if (closesForm) form = null;
    notify(deletedMessage(s.name));
    secrets.reload();
  };
  const closeForm = () => {
    setFocusId(form?.mode === 'edit' && form.id ? `ad-edit-${form.id}` : 'ad-new-secret');
    form = null;
  };
  const edit = (s: SecretSummary) => {
    confirming = '';
    form = editForm(s);
  };
</script>

{#snippet maskNoWrap(text: string)}{#each maskParts(text) as part, i (i)}{#if isMask(part)}<span
        class="ad-nowrap">{part}</span
      >{:else if part}{part}{/if}{/each}{/snippet}

{#if secrets.status === 'error'}<ErrorBlock error={secrets.error} what="Secrets" onretry={secrets.reload} />{:else if !secrets.data}<LoadingBlock
    label="secrets"
  />{:else}<SplitPane mainWidth="560px" sideWidth="360px" sideMax="none" class="ad-secrets"
    ><SplitPaneMain as="section" class="ad-secrets-list" aria-labelledby="ad-secrets-title"
      ><div class="ad-section-head ad-section-head-center"
        ><div class="ad-section-title"
          ><h2 id="ad-secrets-title" tabindex="-1">Authentication secrets</h2><p
            >Credentials for Git repositories, remote endpoints and brokers. Users only see a Secret’s name and description.</p
          ></div
        >{#if !form}<Button
            id="ad-new-secret"
            variant="primary"
            icon="plus"
            onclick={() => {
              confirming = '';
              form = { ...EMPTY };
            }}>New secret</Button
          >{/if}</div
      ><div class="table-wrap ad-secrets-table"
        ><table class="table"
          ><caption class="sr-only">Secrets. Values are never shown.</caption><thead
            ><tr
              ><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Credentials</th><th scope="col">Used by</th><th scope="col">Updated</th><th
                scope="col"
                data-align="end">Actions</th
              ></tr
            ></thead
          ><tbody
            >{#each list as s (s.id)}{@const used = s.usedBy ?? 0}<tr
                data-selected={form?.id === s.id ? '' : undefined}
                data-confirming={confirming === s.id ? '' : undefined}
                ><th scope="row"
                  ><span class="ad-secret-name"
                    ><Icon name="key" size={16} class="ad-secret-icon" /><span class="ad-secret-text"
                      ><span class="ad-secret-id">{s.name}</span><span class="ad-secret-desc">{s.description}</span></span
                    ></span
                  ></th
                ><td><span class="ad-secret-type">{SECRET_KIND_LABEL[s.kind]}</span></td><td class="ad-secret-detail"
                  >{@render maskNoWrap(s.detail ?? s.masked)}</td
                ><td class="ad-secret-used" data-unused={used === 0 ? '' : undefined}>{usedLabel(used)}</td><td class="ad-secret-updated"
                  >{updated(s)}</td
                ><td data-align="end"
                  ><span class="ad-secret-actions"
                    ><button type="button" id={`ad-edit-${s.id}`} class="ad-text-button" aria-label={`Edit secret ${s.name}`} onclick={() => edit(s)}
                      >Edit</button
                    ><button
                      type="button"
                      id={`ad-del-${s.id}`}
                      class="ad-danger-button"
                      aria-label={`Delete secret ${s.name}`}
                      aria-expanded={confirming === s.id}
                      onclick={() => (confirming = s.id)}>Delete</button
                    ></span
                  ></td
                ></tr
              >{#if confirming === s.id}<tr class="ad-confirm-row"
                  ><td colspan={6}
                    ><div role="alert" class="ad-confirm"
                      ><Icon name="warning" size={14} class="ad-confirm-icon" /><span class="ad-confirm-text"
                        >Delete <!---->{s.name}<!---->? <!---->{confirmMessage(used)}</span
                      ><button
                        type="button"
                        class="ad-small-button"
                        onclick={() => {
                          confirming = '';
                          setFocusId(`ad-del-${s.id}`);
                        }}>Cancel</button
                      ><button type="button" class="ad-small-button" data-danger="" onclick={() => remove(s)}>Delete secret</button></div
                    ></td
                  ></tr
                >{/if}{/each}</tbody
          ></table
        ></div
      ></SplitPaneMain
    >{#if form}<SplitPaneSide
        >{#key form.id ?? 'new'}<SecretForm
            initial={form}
            names={list.map((s) => s.name)}
            oncancel={closeForm}
            onsaved={(message) => {
              closeForm();
              notify(message);
              secrets.reload();
            }}
          />{/key}</SplitPaneSide
      >{/if}</SplitPane
  >{/if}
