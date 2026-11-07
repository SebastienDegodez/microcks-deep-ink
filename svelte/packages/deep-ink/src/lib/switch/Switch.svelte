
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLInputAttributes, 'class' | 'type' | 'role' | 'checked' | 'children' | 'size'> &
    NativeHandlers<HTMLInputElement> & {
    /** Visible label. Name what the switch controls, not its state. */
    label: string | Snippet;
    description?: string | Snippet;
    checked: boolean;
    oncheckedchange?: (checked: boolean) => void;
    /** `md` (default): 36 x 20 track. `lg`: 42 x 24 track (Behavior). */
    size?: 'md' | 'lg';
    class?: string;
    element?: HTMLInputElement;
  };

  let { label, description, checked = $bindable(), oncheckedchange, size = 'md', class: cssClass, element = $bindable(), ...rest }: Props = $props();

  const events = $derived(eventProps(rest));
  const uid = $props.id();
  const labelId = `${uid}-label`;
  const descId = $derived(description ? `${uid}-desc` : undefined);
</script>

{#snippet node(content: string | Snippet)}{#if typeof content === 'function'}{@render content()}{:else}{content}{/if}{/snippet}

<label class="choice"
  ><input
    bind:this={element}
    {...events}
    type="checkbox"
    role="switch"
    aria-labelledby={labelId}
    class={['switch', cssClass].filter(Boolean).join(' ')}
    data-size={size === 'lg' ? 'lg' : undefined}
    bind:checked
    onchange={(e) => {
      events.onchange?.(e);
      oncheckedchange?.(e.currentTarget.checked);
    }}
    aria-describedby={[rest['aria-describedby'], descId].filter(Boolean).join(' ') || undefined}
  /><span
    ><span class="choice-label" id={labelId}>{@render node(label)}</span
    >{#if description}<span class="choice-description" id={descId}>{@render node(description)}</span>{/if}</span
  ></label
>
