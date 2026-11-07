
<script lang="ts">
  import type { HTMLProgressAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLProgressAttributes, 'class' | 'value' | 'max' | 'children'> &
    NativeHandlers<HTMLProgressElement> & {
    /** Visible label. */
    label: string;
    /** Omit for an indeterminate progress. */
    value?: number;
    max?: number;
    class?: string;
  };

  const auto = $props.id();
  let { label, value, max = 100, class: cssClass, id, ...rest }: Props = $props();

  const fieldId = $derived(id ?? auto);
  const percent = $derived(value === undefined ? undefined : Math.round((value / max) * 100));
</script>

<div class="progress-field">
  <div class="progress-head">
    <label class="progress-label" for={fieldId}>{label}</label
    ><span class="progress-value">{percent === undefined ? 'In progress' : `${percent}%`}</span>
  </div>
  <progress {...eventProps(rest)} id={fieldId} class={['progress', cssClass].filter(Boolean).join(' ')} {value} {max}></progress>
</div>
