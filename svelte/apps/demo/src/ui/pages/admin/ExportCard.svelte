<script lang="ts">
  import type { Snapshot } from '@microcks/demo-core/domain/govern';
  import { ApiBadge, Button, Icon, SplitPaneMain, type Protocol } from '@microcks/deep-ink';
  import { useQuery, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import { plural } from './notify';
  import { INITIAL, toggledSelection } from './snapshots';

  const uc = useUseCases();
  const services = useQuery(() => uc.govern.listSnapshotServices());
  let selected = $state.raw<string[]>([...INITIAL]);
  let exported = $state.raw<Snapshot | null>(null);

  const list = $derived(services.data ?? []);
  const choose = (ids: string[]) => {
    selected = ids;
    exported = null;
  };
  const doExport = async () => {
    const snap = await uc.govern.exportSnapshot(selected);
    exported = snap;
  };
</script>

{#if services.status === 'error'}<ErrorBlock error={services.error} what="Services" onretry={services.reload} />{:else}<SplitPaneMain
    as="section"
    class="ad-snap-card"
    aria-labelledby="ad-export-title"
    ><div class="ad-snap-head"
      ><h2 id="ad-export-title">Export</h2><div class="ad-snap-select"
        ><span class="ad-meta">{selected.length}<!----> of <!---->{list.length}<!----> selected</span><button
          type="button"
          class="ad-link-button"
          onclick={() => choose(list.map((s) => s.id))}>Select all</button
        ><button type="button" class="ad-link-button" onclick={() => choose([])}>None</button></div
      ></div
    >{#if services.data}<fieldset class="ad-snap-grid"
        ><legend class="sr-only">Services to export</legend>{#each list as s (s.id)}{@const on = selected.includes(s.id)}<label
            class="ad-snap-service"
            data-selected={on ? '' : undefined}
            ><input type="checkbox" checked={on} onchange={(e) => choose(toggledSelection(selected, s.id, e.currentTarget.checked))} /><ApiBadge
              protocol={s.protocol as Protocol}
              name={`${s.name} ${s.version}`}
              size="sm"
              class="ad-snap-badge"
            /><span class="ad-snap-ops">{plural(s.operationCount, 'op')}</span></label
          >{/each}</fieldset
      >{:else}<LoadingBlock label="services" lines={3} />{/if}<div class="ad-snap-actions"
      ><Button variant="primary" icon="download" disabled={selected.length === 0} onclick={doExport}>Export snapshot</Button><span role="status" class="ad-snap-status"
        >{#if exported}<Icon name="check" size={14} class="ad-ok" /><span class="ad-snap-file">{exported.fileName}</span><span
            >downloaded · <!---->{plural(exported.serviceIds.length, 'service')}<!---->, <!---->{plural(exported.operations ?? 0, 'operation')}<!----> · <!---->{exported.sizeKb}<!---->
            KB</span
          >{/if}</span
      ></div
    ></SplitPaneMain
  >{/if}
