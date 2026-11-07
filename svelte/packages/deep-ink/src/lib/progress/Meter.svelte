<!--
  Native <meter> with a visible label; the value is always written next to the bar. Same props as the React Meter:
  label, value, min, max, low, high, optimum, valueText, className, id plus any <meter> attribute.
-->
<script lang="ts">
  import type { HTMLMeterAttributes } from 'svelte/elements';

  type Props = Omit<HTMLMeterAttributes, 'class' | 'value' | 'min' | 'max' | 'low' | 'high' | 'optimum' | 'children'> & {
    label: string;
    value: number;
    min?: number;
    max: number;
    low?: number;
    high?: number;
    optimum?: number;
    /** Written value, e.g. "11 of 12". Defaults to value / max. */
    valueText?: string;
    className?: string;
  };

  const auto = $props.id();
  let { label, value, min = 0, max, low, high, optimum, valueText, className, id, ...rest }: Props = $props();

  const fieldId = $derived(id ?? auto);
</script>

<div class="progress-field">
  <div class="progress-head">
    <label class="progress-label" for={fieldId}>{label}</label
    ><span class="progress-value">{valueText ?? `${value} / ${max}`}</span>
  </div>
  <meter
    {...rest}
    id={fieldId}
    class={['meter', className].filter(Boolean).join(' ')}
    {value}
    {min}
    {max}
    {low}
    {high}
    optimum={optimum ?? max}
  ></meter>
</div>
