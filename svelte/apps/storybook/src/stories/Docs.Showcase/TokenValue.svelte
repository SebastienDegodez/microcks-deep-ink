<script lang="ts">
  import { THEME_EVENT } from '@microcks/deep-ink';
  let { token }: { token: string } = $props();
  let value = $state('');
  $effect(() => {
    const update = () => { value = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim(); };
    update(); document.addEventListener(THEME_EVENT, update);
    return () => document.removeEventListener(THEME_EVENT, update);
  });
</script>
{value}
