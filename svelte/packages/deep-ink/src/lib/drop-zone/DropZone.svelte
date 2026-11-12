<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import type { DropZoneProps } from './types.js';
  import { filesReadyMessage } from './messages.js';
  let { heading, hint, accept, multiple = true, chooseLabel = 'Choose files', onfiles, size = 'md', class: cssClass, children, ...rest }: DropZoneProps = $props();
  const id = $props.id();
  let dragging = $state(false);
  let message = $state('');
  let zone: HTMLDivElement;
  function take(list: FileList | null) {
    const files = list ? Array.from(list) : [];
    if (!files.length) return;
    message = filesReadyMessage(files.length);
    onfiles(files);
  }
  $effect(() => {
    const over = (event: DragEvent) => { event.preventDefault(); dragging = true; };
    const leave = (event: DragEvent) => { if (!zone.contains(event.relatedTarget as Node | null)) dragging = false; };
    const drop = (event: DragEvent) => { event.preventDefault(); dragging = false; take(event.dataTransfer?.files ?? null); };
    zone.addEventListener('dragover', over);
    zone.addEventListener('dragleave', leave);
    zone.addEventListener('drop', drop);
    return () => { zone.removeEventListener('dragover', over); zone.removeEventListener('dragleave', leave); zone.removeEventListener('drop', drop); };
  });
  function change(event: Event & { currentTarget: HTMLInputElement }) {
    take(event.currentTarget.files);
    event.currentTarget.value = '';
  }
</script>
<div {...rest} role="group" aria-labelledby={`${id}-heading`} class={['drop-zone', cssClass].filter(Boolean).join(' ')} data-dragging={dragging ? '' : undefined} data-size={size === 'sm' ? 'sm' : undefined} bind:this={zone}
  ><span class="drop-zone-icon" aria-hidden="true"><Icon name="upload" size={size === 'sm' ? 28 : 24} /></span
  ><p class="drop-zone-heading" id={`${id}-heading`}>{heading}</p
  ><p class="drop-zone-hint" id={`${id}-hint`}>{#if typeof hint === 'function'}{@render hint()}{:else}{hint}{/if}</p
  ><input {id} type="file" class="drop-zone-input sr-only" {accept} {multiple} aria-describedby={`${id}-heading ${id}-hint`} onchange={change}
  /><div class="drop-zone-actions"><label for={id} class="button drop-zone-choose" data-variant={size === 'sm' ? 'secondary' : 'primary'}>{chooseLabel}</label>{#if typeof children === 'function'}{@render children()}{:else}{children}{/if}</div
  ><p class={message ? 'drop-zone-status' : 'drop-zone-status sr-only'} role="status" data-empty={message ? undefined : ''}>{message}</p>
</div>
