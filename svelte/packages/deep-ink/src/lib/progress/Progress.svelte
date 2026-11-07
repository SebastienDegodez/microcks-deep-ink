<!--
  Native <progress> with a visible label and a written value, never color alone (registry item progress). Same props
  as the React Progress: label, value (omit it for an indeterminate progress), max, className, id plus any <progress>
  attribute and React handler (onClick...), on the <progress>.
-->
<script lang="ts">
  import type { HTMLProgressAttributes } from 'svelte/elements';
  import { reactEvents, type ReactHandlers } from '../react-events';

  type Props = Omit<HTMLProgressAttributes, 'class' | 'value' | 'max' | 'children'> &
    ReactHandlers<HTMLProgressElement> & {
    /** Visible label. */
    label: string;
    /** Omit for an indeterminate progress. */
    value?: number;
    max?: number;
    className?: string;
  };

  const auto = $props.id();
  let { label, value, max = 100, className, id, ...rest }: Props = $props();

  const fieldId = $derived(id ?? auto);
  const percent = $derived(value === undefined ? undefined : Math.round((value / max) * 100));
</script>

<div class="progress-field">
  <div class="progress-head">
    <label class="progress-label" for={fieldId}>{label}</label
    ><span class="progress-value">{percent === undefined ? 'In progress' : `${percent}%`}</span>
  </div>
  <progress {...reactEvents(rest)} id={fieldId} class={['progress', className].filter(Boolean).join(' ')} {value} {max}></progress>
</div>
