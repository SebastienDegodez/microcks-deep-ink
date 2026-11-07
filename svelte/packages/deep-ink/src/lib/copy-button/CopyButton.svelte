
<script lang="ts" module>
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
</script>

<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Button from '../Button.svelte';

  type Props = Omit<ComponentProps<typeof Button>, 'onclick' | 'children' | 'icon' | 'loading'> & {
    /** Text copied to the clipboard. */
    value: string;
    /** Idle label. With `iconOnly` it becomes the accessible name. */
    label?: string;
    /** Label shown for 2 seconds after a successful copy. */
    copiedLabel?: string;
  };

  let { value, label = 'Copy', copiedLabel = 'Copied', size = 'sm', variant = 'secondary', iconOnly, class: cssClass, element = $bindable(), ...props }: Props = $props();

  let copyState = $state<'idle' | 'copied' | 'failed'>('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => () => clearTimeout(timer));

  // the reference implementation overrides onclick with the copy action.
  const rest = $derived(Object.fromEntries(Object.entries(props).filter(([k]) => k !== 'onclick')));

  async function copy() {
    const ok = await writeClipboard(value);
    copyState = ok ? 'copied' : 'failed';
    clearTimeout(timer);
    timer = setTimeout(() => (copyState = 'idle'), 1800);
  }

  const text = $derived(copyState === 'copied' ? copiedLabel : label);
  const message = $derived(copyState === 'copied' ? copiedLabel : copyState === 'failed' ? 'Copy failed' : '');
</script>

<Button
  bind:element
  {...rest}
  aria-label={iconOnly ? text : props['aria-label']}
  {size}
  {variant}
  {iconOnly}
  icon={copyState === 'copied' ? 'check' : 'copy'}
  class={['copy-button', cssClass]}
  data-state={copyState === 'idle' ? undefined : copyState}
  onclick={copy}>{#if !iconOnly}{text}{/if}</Button
><span role="status" aria-live="polite" class="sr-only">{message}</span>
