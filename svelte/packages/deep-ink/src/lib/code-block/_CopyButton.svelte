<!--
  Private stand-in for the React CopyButton (registry item copy-button, not ported yet): the same markup, a Button and
  a polite live region announcing "Copied" or "Copy failed". Replace with copy-button/CopyButton.svelte once it exists.
-->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import Button from '../button/Button.svelte';

  let { value, className }: { value: string; className?: string } = $props();
  let state: 'idle' | 'copied' | 'failed' = $state('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;
  onDestroy(() => clearTimeout(timer));

  async function writeClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.insetBlockStart = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }

  async function copy() {
    const ok = await writeClipboard(value);
    state = ok ? 'copied' : 'failed';
    clearTimeout(timer);
    timer = setTimeout(() => (state = 'idle'), 1800);
  }
</script>

<Button
  size="sm"
  variant="link"
  icon={state === 'copied' ? 'check' : 'copy'}
  className={['copy-button', className].filter(Boolean).join(' ')}
  data-state={state === 'idle' ? undefined : state}
  onclick={copy}>{state === 'copied' ? 'Copied' : 'Copy'}</Button
><span role="status" aria-live="polite" class="sr-only">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : ''}</span>
