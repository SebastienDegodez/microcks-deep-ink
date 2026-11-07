<!-- Native checkbox or radio inside its label: the body of Checkbox and Radio. -->
<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { ChangeEventHandler, HTMLInputAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  export type ChoiceProps = Omit<HTMLInputAttributes, 'class' | 'type' | 'children'> &
    ReactHandlers<HTMLInputElement> & {
    /** Visible label. */
    label: string | Snippet;
    /** Secondary text, linked with aria-describedby. */
    description?: string | Snippet;
    /** `card`: a bordered card label, selected fill when checked. */
    variant?: 'plain' | 'card' | 'compact';
    className?: string;
    /** Initial state of an uncontrolled input. */
    defaultChecked?: boolean;
    element?: HTMLInputElement;
  };
</script>

<script lang="ts">
  let {
    kind,
    label,
    description,
    variant = 'plain',
    className,
    defaultChecked,
    checked = $bindable(),
    element = $bindable(),
    ...rest
  }: ChoiceProps & { kind: 'checkbox' | 'radio' } = $props();

  const events = $derived(reactEvents(rest));
  const uid = $props.id();
  const labelId = `${uid}-label`;
  const descId = $derived(description ? `${uid}-desc` : undefined);
</script>

{#snippet node(content: string | Snippet)}{#if typeof content === 'function'}{@render content()}{:else}{content}{/if}{/snippet}

<label class="choice" data-variant={variant}
  ><input
    bind:this={element}
    {...events}
    type={kind}
    checked={checked ?? defaultChecked}
    onchange={(e) => {
      if (kind === 'checkbox') checked = e.currentTarget.checked;
      (events.onchange as ChangeEventHandler<HTMLInputElement> | undefined)?.(e);
    }}
    aria-labelledby={labelId}
    class={[kind, className].filter(Boolean).join(' ')}
    aria-describedby={[rest['aria-describedby'], descId].filter(Boolean).join(' ') || undefined}
  /><span
    ><span class="choice-label" id={labelId}>{@render node(label)}</span
    >{#if description}<span class="choice-description" id={descId}>{@render node(description)}</span>{/if}</span
  ></label
>
