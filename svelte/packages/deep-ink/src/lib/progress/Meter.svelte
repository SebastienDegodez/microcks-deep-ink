
<script lang="ts">
  import type { HTMLMeterAttributes } from 'svelte/elements';
  import { eventProps, type NativeHandlers } from '../event-props';

  type Props = Omit<HTMLMeterAttributes, 'class' | 'value' | 'min' | 'max' | 'low' | 'high' | 'optimum' | 'children'> &
    NativeHandlers<HTMLMeterElement> & {
    label: string;
    value: number;
    min?: number;
    max: number;
    low?: number;
    high?: number;
    optimum?: number;
    /** Written value, e.g. "11 of 12". Defaults to value / max. */
    valueText?: string;
    class?: string;
  };

  const auto = $props.id();
  let { label, value, min = 0, max, low, high, optimum, valueText, class: cssClass, id, ...rest }: Props = $props();

  const fieldId = $derived(id ?? auto);
</script>

<div class="progress-field">
  <div class="progress-head">
    <label class="progress-label" for={fieldId}>{label}</label
    ><span class="progress-value">{valueText ?? `${value} / ${max}`}</span>
  </div>
  <meter
    {...eventProps(rest)}
    id={fieldId}
    class={['meter', cssClass].filter(Boolean).join(' ')}
    {value}
    {min}
    {max}
    {low}
    {high}
    optimum={optimum ?? max}
  ></meter>
</div>
