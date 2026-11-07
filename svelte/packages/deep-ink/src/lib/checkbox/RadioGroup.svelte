<!--
  `fieldset` + `legend` + native radios (registry item checkbox). Same props as the React RadioGroup: legend, options,
  value, onChange (called with the selected value), name, required, help, error, variant, className. `legend`, `help`,
  `error` and the option labels (ReactNode in React) take a string or a snippet. `value` is also bindable. Arrow keys
  move the selection (native behavior).
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export interface RadioOption {
    value: string;
    label: string | Snippet;
    description?: string | Snippet;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import Icon from '../icon/Icon.svelte';
  import Radio from './Radio.svelte';

  type Props = {
    /** Visible group name, rendered as the fieldset legend. */
    legend: string | Snippet;
    options: RadioOption[];
    value: string | undefined;
    onChange?: (value: string) => void;
    /** Shared name of the radios. Generated when omitted. */
    name?: string;
    required?: boolean;
    help?: string | Snippet;
    error?: string | Snippet;
    /** `card`: each option is a bordered card label. */
    variant?: 'plain' | 'card' | 'compact';
    className?: string;
  };

  let { legend, options, value = $bindable(), onChange, name, required, help, error, variant = 'plain', className }: Props = $props();

  // In expressions, so that the compiler keeps their spaces.
  const asterisk = ' *';
  const errorWord = 'Error: ';

  const uid = $props.id();
  const groupName = $derived(name ?? `${uid}-group`);
  const helpId = $derived(help ? `${uid}-help` : undefined);
  const errorId = $derived(error ? `${uid}-error` : undefined);
</script>

{#snippet node(content: string | Snippet)}{#if typeof content === 'function'}{@render content()}{:else}{content}{/if}{/snippet}

<!-- svelte-ignore a11y_role_supports_aria_props_implicit (same markup as React: the error state of the group) -->
<fieldset
  class={['fieldset', className].filter(Boolean).join(' ')}
  aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
  aria-invalid={error ? true : undefined}
  data-invalid={error ? '' : undefined}
  data-variant={variant}
  ><legend>{@render node(legend)}{#if required}<span class="required" aria-hidden="true">{asterisk}</span>{/if}</legend
  >{#each options as o (o.value)}<Radio
      name={groupName}
      value={o.value}
      label={o.label}
      description={o.description}
      {variant}
      disabled={o.disabled}
      {required}
      checked={value === o.value}
      onChange={() => {
        value = o.value;
        onChange?.(o.value);
      }}
    />{/each}{#if help}<p class="help" id={helpId}>{@render node(help)}</p>{/if}{#if error}<p class="error" id={errorId}
      ><Icon name="warning" size={16} /><span><span class="sr-only">{errorWord}</span>{@render node(error)}</span></p
    >{/if}</fieldset
>
