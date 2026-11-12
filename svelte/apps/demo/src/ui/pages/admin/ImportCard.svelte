<script lang="ts">
  import type { SnapshotImportPreviewItem } from '@microcks/demo-core/domain/govern';
  import { ApiBadge, Button, DropZone, Icon, SectionLabel, type Protocol } from '@microcks/deep-ink';
  import { RouterLink, useReturnFocus, useUseCases } from '@/ui/app';
  import { LoadingBlock } from '@/ui/app/states';
  import { plural, type Notify } from './notify';
  import { DEFAULT_FILE, SAMPLE, importedMessage } from './snapshots';

  let { notify }: { notify: Notify } = $props();
  const uc = useUseCases();
  const inputId = $props.id();
  let fileName = $state('');
  let preview = $state.raw<SnapshotImportPreviewItem[] | null>(null);
  let result = $state.raw<{ created: number; replaced: number } | null>(null);
  // Each step removes the control that had focus: move it to the control that replaces it.
  let section = $state<HTMLElement>();
  const { focusLater } = useReturnFocus();

  const pick = async (name: string) => {
    fileName = name;
    result = null;
    focusLater(() => document.getElementById(`${inputId}-change`));
    preview = name ? await uc.govern.previewSnapshotImport(name) : null;
  };
  const clear = () => {
    // The drop zone's file input has an id of its own: find it by class.
    focusLater(() => section?.querySelector<HTMLElement>('.drop-zone-input'));
    fileName = '';
    preview = null;
    result = null;
  };
  const doImport = async () => {
    const name = fileName;
    const r = await uc.govern.importSnapshot(name);
    result = r;
    focusLater(() => document.getElementById(`${inputId}-open`));
    notify(importedMessage(name, r));
  };
</script>

{#snippet hint()}A <code class="demo-mono">microcks-repository.json</code> exported from any Microcks instance{/snippet}

<section bind:this={section} class="ad-snap-card" aria-labelledby="ad-import-title"
  ><h2 id="ad-import-title">Import</h2>{#if !fileName}<DropZone
      size="sm"
      heading="Drop a snapshot here"
      {hint}
      accept="application/json,.json"
      multiple={false}
      chooseLabel="Choose a file"
      onfiles={(files) => void pick(files[0]?.name ?? DEFAULT_FILE)}
      ><button type="button" class="ad-link-button ad-drop-sample" onclick={() => pick(SAMPLE)}>Use a sample snapshot</button></DropZone
    >{:else}<div class="ad-snap-preview"
      ><div class="ad-snap-filerow"
        ><Icon name="file-plain" size={15} class="ad-snap-file-icon" /><span class="ad-snap-filename">{fileName}</span>{#if !result}<button
            type="button"
            id={`${inputId}-change`}
            class="ad-link-button"
            aria-label={`Change file ${fileName}`}
            onclick={clear}>Change</button
          >{/if}</div
      >{#if preview}<SectionLabel as="h3" size="sm" lineHeight="normal">Preview · <!---->{plural(preview.length, 'service')}<!----> detected</SectionLabel
        ><ul class="ad-snap-items"
          >{#each preview as p (p.name)}<li
              ><ApiBadge protocol={p.protocol as Protocol} name={p.name} size="sm" /><span class="ad-snap-effect" data-kind={p.kind}>{p.effect}</span></li
            >{/each}</ul
        >{:else}<LoadingBlock label="snapshot preview" lines={3} />{/if}{#if result}<div role="status" class="ad-snap-done"
          ><Icon name="check" size={14} class="ad-ok" /><span class="ad-snap-done-text"
            >Imported · <!---->{result.created}<!----> created, <!---->{result.replaced}<!----> replaced</span
          ><RouterLink to="/services" id={`${inputId}-open`} class="ad-snap-done-link">Open APIs &amp; Services</RouterLink><button
            type="button"
            class="ad-link-button"
            onclick={clear}>Import another</button
          ></div
        >{:else}<div class="ad-snap-actions"
          ><Button variant="primary" icon="upload" disabled={!preview} onclick={doImport}>Import snapshot</Button><span class="ad-note"
            >Services with the same name and version are replaced.</span
          ></div
        >{/if}</div
    >{/if}</section
>
