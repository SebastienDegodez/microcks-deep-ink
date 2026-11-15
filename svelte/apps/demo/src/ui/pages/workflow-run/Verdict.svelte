<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Icon } from '@microcks/deep-ink';
  import { verdictStroke, type VerdictIcon } from './api';

  interface Props {
    tone: 'success' | 'danger' | 'muted' | 'warning' | 'running';
    icon: VerdictIcon;
    size?: number;
    children: Snippet;
  }

  /** Small status glyph + word, never colour only: "✓ Passed", "✕ Failed", "– Off". */
  let { tone, icon, size = 12, children }: Props = $props();
  const stroke = $derived(verdictStroke(icon));
</script>

<span class="wfr-verdict" data-tone={tone}
  ><Icon name={icon} {size} stroke-width={stroke.width} stroke-dasharray={stroke.dash} />{@render children()}</span
>
