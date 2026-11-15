<script lang="ts">
  import { THEME_EVENT } from '@microcks/deep-ink';
  let { token, as = 'li' }: { token: string; as?: 'li' | 'div' } = $props();
  let value = $state('');
  $effect(() => {
    const update = () => { value = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim(); };
    update(); document.addEventListener(THEME_EVENT, update);
    return () => document.removeEventListener(THEME_EVENT, update);
  });
</script>
<svelte:element this={as} class="sb-swatch"><i style:background={`var(--${token})`} aria-hidden="true"></i><div><code>--{token}</code><br /><small style="font:var(--type-small);color:var(--text-secondary)">{value.toUpperCase()}</small></div></svelte:element>
