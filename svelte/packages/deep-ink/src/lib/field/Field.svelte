<!--
  Label, control, help and error wired together (registry item field). Same props as the React Field: label, help,
  error, required, className. `label`, `help` and `error` (ReactNode in React) take a string or a snippet. React's
  render-prop child is a snippet that receives the props to spread on the control:
  `{#snippet children(control)}<Input {...control} />{/snippet}`.
-->
<script lang="ts" module>
  /** Props to spread on the form control rendered inside a `Field`. */
  export interface FieldControlProps {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
    required?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from '../icon/Icon.svelte';

  type Props = {
    /** Visible label. Always rendered. */
    label: string | Snippet;
    help?: string | Snippet;
    /** Error message. Shown with an icon and the word "Error", never color alone. */
    error?: string | Snippet;
    required?: boolean;
    /** Receives the props to spread on the control. */
    children: Snippet<[FieldControlProps]>;
    className?: string;
  };

  let { label, help, error, required, children, className }: Props = $props();

  // In expressions, so that the compiler keeps their spaces.
  const asterisk = ' *';
  const errorWord = 'Error: ';

  const uid = $props.id();
  const id = `${uid}-control`;
  const helpId = $derived(help ? `${uid}-help` : undefined);
  const errorId = $derived(error ? `${uid}-error` : undefined);
  const control: FieldControlProps = $derived({
    id,
    'aria-describedby': [helpId, errorId].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? true : undefined,
    required: required || undefined,
  });
</script>

{#snippet node(content: string | Snippet)}{#if typeof content === 'function'}{@render content()}{:else}{content}{/if}{/snippet}

<!-- Kept on few lines: whitespace between the tags would change the text and the accessible names. -->
<div class={['field', className].filter(Boolean).join(' ')} data-invalid={error ? '' : undefined}
  ><label class="label" for={id}
    >{@render node(label)}{#if required}<span class="required" aria-hidden="true">{asterisk}</span>{/if}</label
  >{@render children(control)}{#if help}<p class="help" id={helpId}>{@render node(help)}</p>{/if}{#if error}<p
      class="error"
      id={errorId}><Icon name="cross" size={13} /><span><span class="sr-only">{errorWord}</span>{@render node(error)}</span></p
    >{/if}</div
>
