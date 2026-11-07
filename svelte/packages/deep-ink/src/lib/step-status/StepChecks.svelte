<!--
  The two checks of a step, written separately: a 200 that breaks the schema still fails the step (registry item
  step-status). Same props as the React StepChecks: successCriteria, schemaValidation, className plus any <ul>
  attribute and React handler (onClick...).
-->
<script lang="ts" module>
  export type CheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';

  const CHECK = {
    passed: { icon: 'check', word: 'Passed' },
    failed: { icon: 'cross', word: 'Failed' },
    off: { icon: 'dash', word: 'Off' },
    'not-evaluated': { icon: 'circle', word: 'Not evaluated' },
  } as const;
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from '../icon/Icon.svelte';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'children'> &
    ReactHandlers<HTMLUListElement> & {
    successCriteria: CheckState;
    /** Omit when the run does not validate schemas. */
    schemaValidation?: CheckState;
    className?: string;
  };

  let { successCriteria, schemaValidation, className, ...rest }: Props = $props();
</script>

{#snippet check(label: string, state: CheckState)}<li data-state={state}
    ><span>{label}</span><span class="sr-only">:</span> <span class="checks-state"
      ><Icon name={CHECK[state].icon} size={14} />{CHECK[state].word}</span
    ></li
  >{/snippet}

<ul {...reactEvents(rest)} class={['checks', className].filter(Boolean).join(' ')}
  >{@render check('Success criteria', successCriteria)}{#if schemaValidation}{@render check('Schema validation', schemaValidation)}{/if}</ul
>
