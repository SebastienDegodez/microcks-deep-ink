
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Button from '../Button.svelte';
  import Icon from '../icon/Icon.svelte';
  import { THEME_EVENT, getTheme, restoreTheme, setTheme, type Theme } from './theme-toggle';

  type Props = Omit<ComponentProps<typeof Button>, 'children' | 'onclick' | 'aria-pressed' | 'aria-label' | 'variant' | 'iconOnly' | 'class' | 'icon'>;

  let { element = $bindable(), ...props }: Props = $props();

  const FIXED = new Set(['onclick', 'children', 'aria-pressed', 'aria-label', 'variant', 'iconOnly', 'class', 'type', 'icon']);
  const rest = $derived(Object.fromEntries(Object.entries(props).filter(([k]) => !FIXED.has(k))));

  // Dark on the server and during hydration (as the reference implementation's server snapshot), then the live value.
  let theme = $state<Theme>('dark');

  $effect(() => {
    const sync = () => (theme = getTheme());
    document.addEventListener(THEME_EVENT, sync);
    sync();
    // Applies the saved preference once; the event it dispatches updates `theme`.
    restoreTheme();
    return () => document.removeEventListener(THEME_EVENT, sync);
  });
</script>

<Button
  bind:element
  {...rest}
  type="button"
  variant="secondary"
  iconOnly
  class="theme-toggle"
  aria-label="Light theme"
  aria-pressed={theme === 'light'}
  onclick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon name="moon" size={18} /></Button
>
