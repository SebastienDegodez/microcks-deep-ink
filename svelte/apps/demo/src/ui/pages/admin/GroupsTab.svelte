<script lang="ts">
  import '@microcks/demo-styles/pages/admin/groups.css';
  import { membershipChanges, membershipKey, type AdminGroup, type AdminUser } from '@microcks/demo-core/domain/govern';
  import { Button, Icon } from '@microcks/deep-ink';
  import { useReturnFocus, useUseCases, type QueryResult } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { appliedMessage, cellLabel, cellState, cellTitle, changesLine, draftMembers, groupColumnWidth, matrixMinWidth, toggledDraft } from './groups';
  import { plural, type Notify } from './notify';
  import { savedMemberships } from './tabs';

  interface Props {
    users: QueryResult<AdminUser[]>;
    groups: QueryResult<AdminGroup[]>;
    /** `groupId|userId` keys, or null when nothing changed. Owned by the page so it survives a tab change. */
    draft: string[] | null;
    notify: Notify;
    onchanged: () => void;
  }

  /** Roles × groups matrix: one column per manager, one row per value of the master label `domain`. */
  let { users, groups, draft = $bindable(), notify, onchanged }: Props = $props();
  const uc = useUseCases();
  // Discard and Apply remove the pending bar (and the focused button): focus moves to the section heading.
  let heading = $state<HTMLHeadingElement>();
  // Apply and Discard remove the draft controls: focus goes back to the section heading.
  const { focusLater } = useReturnFocus();

  const all = $derived(groups.data ?? []);
  const managers = $derived((users.data ?? []).filter((u) => u.role === 'manager'));
  const saved = $derived(savedMemberships(all));
  const current = $derived(draft ?? saved);
  const changes = $derived(membershipChanges(saved, current));
  const coverage = (g: AdminGroup) => managers.filter((m) => current.includes(membershipKey(g.id, m.id))).length;
  const uncovered = $derived(all.filter((g) => coverage(g) === 0).length);

  const toggle = (key: string) => {
    draft = toggledDraft(current, saved, key);
  };
  const apply = async () => {
    const list = all;
    const pendingChanges = changes;
    const members = current;
    const touched = new Set(pendingChanges.map((c) => c.groupId));
    for (const g of list) {
      if (!touched.has(g.id)) continue;
      await uc.govern.saveMembers(g.id, draftMembers(members, g.id));
    }
    notify(appliedMessage(pendingChanges.length));
    draft = null;
    focusLater(() => heading);
    onchanged();
  };
</script>

{#if groups.status === 'error'}<ErrorBlock error={groups.error} what="Groups" onretry={groups.reload} />{:else if users.status === 'error'}<ErrorBlock
    error={users.error}
    what="Users"
    onretry={users.reload}
  />{:else if !groups.data || !users.data}<LoadingBlock label="groups" />{:else}<div class="ad-tab"
    ><div class="ad-section-head"
      ><div class="ad-section-title"
        ><h2 bind:this={heading} tabindex="-1">Manager groups</h2><p
          >One group per value of the master label <span class="demo-mono">domain</span>. A member manages the Services carrying that value. Click a cell to add or remove a membership, then apply.</p
        ></div
      ><span class="ad-meta"
        >{plural(all.length, 'group')}<!----> × <!---->{plural(managers.length, 'manager')}<!---->{#if uncovered}{` · ${uncovered} without manager`}{/if}</span
      ></div
    ><div class="ad-card"
      ><div class="ad-scroll"
        ><table class="ad-matrix" style:min-width={matrixMinWidth(managers.length)}
          ><caption class="sr-only">Group memberships: groups by managers</caption><colgroup
            ><col style:width={groupColumnWidth(managers.length)} />{#each managers as m (m.id)}<col />{/each}<col class="ad-matrix-coverage" /></colgroup
          ><thead
            ><tr
              ><th scope="col">Group</th>{#each managers as m (m.id)}<th scope="col" class="ad-matrix-head"
                  ><span class="ad-avatar ad-avatar-sm" aria-hidden="true">{m.initials}</span><span class="ad-matrix-id" title={m.name}>{m.id}</span></th
                >{/each}<th scope="col" class="ad-matrix-end">Coverage</th></tr
            ></thead
          ><tbody
            >{#each all as g (g.id)}{@const n = coverage(g)}{@const count = g.services?.length ?? 0}<tr
                ><th scope="row"
                  ><span class="ad-matrix-path">{g.name}</span><span class="ad-matrix-sub">domain=<!---->{g.id}<!----> · <!---->{plural(count, 'Service')}</span></th
                >{#each managers as m (m.id)}{@const key = membershipKey(g.id, m.id)}{@const was = saved.includes(key)}{@const now = current.includes(key)}{@const state = cellState(
                    was,
                    now,
                  )}<td class="ad-matrix-cell"
                    ><button
                      type="button"
                      class="ad-cell"
                      data-state={state}
                      aria-pressed={now}
                      aria-label={cellLabel(m, g, now, state)}
                      title={cellTitle(state, now)}
                      onclick={() => toggle(key)}
                      >{#if now}<Icon name="check" size={16} stroke-width={2.8} />{:else if state === 'remove'}<Icon name="dash" size={14} stroke-width={2.6} />{:else}<span
                          class="ad-cell-dot"
                          aria-hidden="true"
                        ></span>{/if}</button
                    ></td
                  >{/each}<td class="ad-matrix-end"
                  ><span class="ad-coverage" data-ok={n > 0 ? '' : undefined}
                    ><Icon name={n > 0 ? 'check' : 'warning'} size={13} />{n > 0 ? plural(n, 'manager') : 'no manager'}</span
                  ></td
                ></tr
              >{/each}</tbody
          ></table
        ></div
      >{#if changes.length > 0}<div class="ad-pending" role="group" aria-label="Pending membership changes"
          ><span class="ad-pending-count"><Icon name="clock-sm" size={14} />{plural(changes.length, 'pending change')}</span><span class="ad-pending-list"
            >{changesLine(changes, all)}</span
          ><Button
            onclick={() => {
              draft = null;
              focusLater(() => heading);
            }}>Discard</Button
          ><Button variant="primary" onclick={apply}>Apply to Keycloak</Button></div
        >{/if}</div
    ><div class="ad-legend ad-legend-sm"
      ><span class="ad-swatch-item"><span class="ad-swatch" data-state="member" aria-hidden="true"></span>member</span><span class="ad-swatch-item"
        ><span class="ad-swatch" data-state="add" aria-hidden="true"></span>to be added</span
      ><span class="ad-swatch-item"><span class="ad-swatch" data-state="remove" aria-hidden="true"></span>to be removed</span><span
        >Only users with the <span class="ad-legend-key">manager</span> role appear as columns. Admins manage every Service.</span
      ></div
    ></div
  >{/if}
