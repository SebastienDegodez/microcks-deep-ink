<script lang="ts">
  import { fmt } from '@/ui/app/format';
  import { DAY_LETTERS, barHeight, longDay, sparkDays } from './overview';

  /** Calls of the last 7 days, the last bar being today (demo clock). */
  let { values, total, today }: { values: number[]; total: number; today: Date } = $props();

  const max = $derived(Math.max(1, ...values));
  const days = $derived(sparkDays(values, today));
</script>

<div class="spark-box"
  ><div class="spark-box-head"><span>Calls · 7 days</span><span class="spark-box-total">{fmt(total)}</span></div
  ><div
    class="spark-box-bars"
    role="img"
    aria-label={`Calls over 7 days: ${values.map((v, i) => `${longDay(days[i])} ${fmt(v)}`).join(', ')}`}
    >{#each values as v, i (i)}<span
        data-today={i === values.length - 1 ? '' : undefined}
        style:height={barHeight(v, max)}
        title={`${longDay(days[i])}: ${fmt(v)} calls`}
      ></span>{/each}</div
  ><div class="spark-box-days" aria-hidden="true">{#each days as d, i (i)}<span>{DAY_LETTERS[d.getUTCDay()]}</span>{/each}</div
  ></div
>
