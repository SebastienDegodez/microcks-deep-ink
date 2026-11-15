<script lang="ts">
  import type { TestTarget } from '@microcks/demo-core/domain/testing';
  import { Button, Input, Select } from '@microcks/deep-ink';
  import type { Draft, HeaderRow, UpdateDraft } from './draft';
  import FormSection from './FormSection.svelte';
  import { addApiKeyHeader, addHeader, patchHeader, removeHeader } from './form';

  /** "05 Request headers": extra headers, for all operations or for one. Not shown for an event API. */
  let { target, d, update }: { target: TestTarget; d: Draft; update: UpdateDraft } = $props();
  const setHeader = (id: number, patch: Partial<HeaderRow>) => update(patchHeader(d, id, patch));
</script>

<FormSection step="05" title="Request headers" hint="Optional · added to or overriding the examples' headers" gap="12"
  >{#if d.headers.length === 0}<p class="tc-empty">No extra header. Use a comma-separated list for several values of the same header.</p>{/if}{#if d.headers.length > 0}<div class="tc-headers"
      ><div class="tc-header-row tc-header-head" aria-hidden="true"><span>Applies to</span><span>Name</span><span>Values</span><span></span></div
      >{#each d.headers as h, i (h.id)}<div class="tc-header-row"
          ><Select
            aria-label={`Header ${i + 1} applies to`}
            class="tc-mono-select"
            value={h.scope}
            onchange={(e) => setHeader(h.id, { scope: e.currentTarget.value })}
            ><option value="globals">All operations</option>{#each target.operations as o (o.id)}<option value={o.name}>{o.name}</option>{/each}</Select
          ><Input
            aria-label={`Header ${i + 1} name`}
            mono
            spellcheck={false}
            placeholder="x-api-key"
            value={h.name}
            oninput={(e) => setHeader(h.id, { name: e.currentTarget.value })}
          /><Input
            aria-label={`Header ${i + 1} values`}
            mono
            spellcheck={false}
            placeholder="value1, value2"
            value={h.values}
            oninput={(e) => setHeader(h.id, { values: e.currentTarget.value })}
          /><Button iconOnly icon="cross" size="sm" aria-label={`Remove header ${h.name || i + 1}`} onclick={() => update(removeHeader(d, h.id))} /></div
        >{/each}</div
    >{/if}<div class="tc-header-actions"
    ><Button variant="dashed" size="compact" icon="plus" onclick={() => update(addHeader(d))}>Add header</Button
    >{#if d.headers.length === 0}<Button variant="outline" size="compact" class="tc-apikey" onclick={() => update(addApiKeyHeader(d))}
        >+ x-api-key (globals)</Button
      >{/if}</div
  ></FormSection
>
