<!--
  Modal dialog on the native <dialog> (registry item dialog). Same props as the React Dialog: open, onClose, title,
  description, footer, size, closeOnBackdrop, className. `description` and `footer` (ReactNode in React) take a string
  or a snippet; the body is the children. showModal() provides the focus trap, the inert background and Escape; focus
  goes to [data-autofocus], else the first control of the body or footer, and returns to the opener on close.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from '../button/Button.svelte';

  type Props = {
    open: boolean;
    /** Called when the dialog asks to close: Escape, the close button or a backdrop click. Set `open` to false. */
    onClose: () => void;
    title: string;
    description?: string | Snippet;
    children?: Snippet;
    /** Action buttons, aligned to the end. */
    footer?: string | Snippet;
    size?: 'sm' | 'md' | 'lg';
    /** Close on a click on the backdrop. Off by default so a stray click never loses typed data. */
    closeOnBackdrop?: boolean;
    className?: string;
  };

  let { open, onClose, title, description, children, footer, size = 'md', closeOnBackdrop = false, className }: Props = $props();

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const within = (scope: string) => FOCUSABLE.split(', ').map((s) => `${scope} ${s}`).join(', ');

  const uid = $props.id();
  const titleId = `${uid}-title`;
  const descId = $derived(description ? `${uid}-desc` : undefined);
  let dialog: HTMLDialogElement | undefined = $state();
  let opener: HTMLElement | null = null;

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const preferred =
        dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLElement>(within('.dialog-body')) ??
        dialog.querySelector<HTMLElement>(within('.dialog-footer'));
      preferred?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  // Optional light dismiss: a click that lands on the dialog element itself is a click on the backdrop.
  const onclick = (e: MouseEvent) => {
    if (closeOnBackdrop && e.target === dialog) onClose();
  };

  // Restore focus when the dialog is closed, whatever closed it (Escape, button, prop).
  const onclose = () => {
    const target = opener;
    opener = null;
    target?.focus();
    // Escape closes natively: tell the owner so it can set open=false.
    if (open) onClose();
  };
</script>

{#snippet content(c: string | Snippet)}{#if typeof c === 'function'}{@render c()}{:else}{c}{/if}{/snippet}

<dialog
  bind:this={dialog}
  class={['dialog', className].filter(Boolean).join(' ')}
  data-size={size}
  aria-labelledby={titleId}
  aria-describedby={descId}
  {onclick}
  {onclose}
>
  {#if open}
    <div class="dialog-header">
      <h2 class="dialog-title" id={titleId}>{title}</h2>
      <Button variant="ghost" size="sm" iconOnly icon="close" aria-label="Close" onclick={onClose} />
    </div>
    <div class="dialog-body">
      {#if description}<p class="dialog-description" id={descId}>{@render content(description)}</p>{/if}
      {@render children?.()}
    </div>
    {#if footer}<div class="dialog-footer">{@render content(footer)}</div>{/if}
  {/if}
</dialog>
