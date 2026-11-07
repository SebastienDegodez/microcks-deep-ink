<!--
  Copies `value` to the clipboard (registry item copy-button): a Button plus a visually hidden polite live region that
  announces "Copied" or "Copy failed", so the result is never visual only. Same props as the React CopyButton: value,
  label, copiedLabel and the Button props (variant, size, tone, iconOnly, className, any <button> attribute and React
  handler) except onClick, children, icon and loading. The copied label shows for 1.8 seconds, as in React.
-->
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
  import Button from '../button/Button.svelte';

  type Props = Omit<ComponentProps<typeof Button>, 'onClick' | 'onclick' | 'children' | 'icon' | 'loading'> & {
    /** Text copied to the clipboard. */
    value: string;
    /** Idle label. With `iconOnly` it becomes the accessible name. */
    label?: string;
    /** Label shown for 2 seconds after a successful copy. */
    copiedLabel?: string;
  };

  let { value, label = 'Copy', copiedLabel = 'Copied', size = 'sm', variant = 'secondary', iconOnly, className, element = $bindable(), ...props }: Props = $props();

  let copyState = $state<'idle' | 'copied' | 'failed'>('idle');
  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => () => clearTimeout(timer));

  // React overrides onClick with the copy action.
  const rest = $derived(Object.fromEntries(Object.entries(props).filter(([k]) => k !== 'onClick' && k !== 'onclick')));

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
  className={['copy-button', className].filter(Boolean).join(' ')}
  data-state={copyState === 'idle' ? undefined : copyState}
  onclick={copy}>{#if !iconOnly}{text}{/if}</Button
><span role="status" aria-live="polite" class="sr-only">{message}</span>
