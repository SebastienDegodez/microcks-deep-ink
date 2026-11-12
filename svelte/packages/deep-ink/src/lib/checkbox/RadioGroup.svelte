
<script lang="ts" module>
  import type { Snippet } from 'svelte';

  export interface RadioOption {
    value: string;
    label: string | Snippet;
    description?: string | Snippet;
    disabled?: boolean;
  }
</script>

<script lang="ts" generics="Option extends RadioOption">
  import Icon from '../icon/Icon.svelte';
  import Radio from './Radio.svelte';

  type Props = {
    /** Visible group name, rendered as the fieldset legend. */
    legend: string | Snippet;
    options: Option[];
    /** Renders each option's label from its data, without creating one snippet per option. */
    renderLabel?: Snippet<[Option]>;
    value: string | undefined;
    onchange?: (value: string) => void;
    /** Shared name of the radios. Generated when omitted. */
    name?: string;
    required?: boolean;
    help?: string | Snippet;
    error?: string | Snippet;
    /** `card`: each option is a bordered card label. */
    variant?: 'plain' | 'card' | 'compact';
    class?: string;
  };

  let { legend, options, renderLabel, value = $bindable(), onchange, name, required, help, error, variant = 'plain', class: cssClass }: Props = $props();

  // In expressions, so that the compiler keeps their spaces.
  const asterisk = ' *';
  const errorWord = 'Error: ';

  const uid = $props.id();
  const groupName = $derived(name ?? `${uid}-group`);
  const helpId = $derived(help ? `${uid}-help` : undefined);
  const errorId = $derived(error ? `${uid}-error` : undefined);
</script>

{#snippet node(content: string | Snippet)}{#if typeof content === 'function'}{@render content()}{:else}{content}{/if}{/snippet}


<fieldset
  role="radiogroup"
  class={['fieldset', cssClass].filter(Boolean).join(' ')}
  aria-describedby={[helpId, errorId].filter(Boolean).join(' ') || undefined}
  aria-invalid={error ? true : undefined}
  data-invalid={error ? '' : undefined}
  data-variant={variant}
  ><legend>{@render node(legend)}{#if required}<span class="required" aria-hidden="true">{asterisk}</span>{/if}</legend
  >{#each options as o (o.value)}{#snippet optionLabel()}{@render renderLabel?.(o)}{/snippet}<Radio
      name={groupName}
      value={o.value}
      label={renderLabel ? optionLabel : o.label}
      description={o.description}
      {variant}
      disabled={o.disabled}
      {required}
      checked={value === o.value}
      onchange={() => {
        value = o.value;
        onchange?.(o.value);
      }}
    />{/each}{#if help}<p class="help" id={helpId}>{@render node(help)}</p>{/if}{#if error}<p class="error" id={errorId}
      ><Icon name="warning" size={16} /><span><span class="sr-only">{errorWord}</span>{@render node(error)}</span></p
    >{/if}</fieldset
>
