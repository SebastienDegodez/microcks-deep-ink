<!--
  On/off setting (registry item switch): a native checkbox with role="switch" inside its label. Same props as the React
  Switch: label, description, checked, onChange (called with the new checked state), size, className plus any <input>
  attribute and React handler (onFocus, onKeyDown...). `label` and `description` (ReactNode in React) take a string or a snippet. `checked` is also bindable;
  React's `ref` is `bind:element` here. Space toggles it; the state is announced as on or off.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ChangeEventHandler, HTMLInputAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLInputAttributes, 'class' | 'type' | 'role' | 'checked' | 'children' | 'size'> &
    Omit<ReactHandlers<HTMLInputElement>, 'onChange'> & {
    /** Visible label. Name what the switch controls, not its state. */
    label: string | Snippet;
    description?: string | Snippet;
    checked: boolean;
    onChange?: (checked: boolean) => void;
    /** `md` (default): 36 x 20 track. `lg`: 42 x 24 track (Behavior). */
    size?: 'md' | 'lg';
    className?: string;
    element?: HTMLInputElement;
  };

  let { label, description, checked = $bindable(), onChange, size = 'md', className, element = $bindable(), ...rest }: Props = $props();

  const events = $derived(reactEvents(rest));
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
    class={['switch', className].filter(Boolean).join(' ')}
    data-size={size === 'lg' ? 'lg' : undefined}
    bind:checked
    onchange={(e) => {
      (events.onchange as ChangeEventHandler<HTMLInputElement> | undefined)?.(e);
      onChange?.(e.currentTarget.checked);
    }}
    aria-describedby={[rest['aria-describedby'], descId].filter(Boolean).join(' ') || undefined}
  /><span
    ><span class="choice-label" id={labelId}>{@render node(label)}</span
    >{#if description}<span class="choice-description" id={descId}>{@render node(description)}</span>{/if}</span
  ></label
>
