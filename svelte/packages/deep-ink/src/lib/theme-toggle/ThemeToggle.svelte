<!--
  Toggle button for the light theme (registry item theme-toggle): a secondary icon-only Button with the moon icon,
  labelled "Light theme"; aria-pressed tells whether it is on. Same props as the React ThemeToggle: any <button>
  attribute and React handler, except children, onClick, aria-pressed and aria-label (className, type, variant and
  iconOnly are fixed, as in React). On mount it applies the saved preference (restoreTheme) and follows
  microcks-theme-change, so every toggle of the page stays in sync. The server renders the dark theme, as React.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Button from '../button/Button.svelte';
  import Icon from '../icon/Icon.svelte';
  import { THEME_EVENT, getTheme, restoreTheme, setTheme, type Theme } from './theme-toggle';

  type Props = Omit<ComponentProps<typeof Button>, 'children' | 'onClick' | 'onclick' | 'aria-pressed' | 'aria-label' | 'variant' | 'iconOnly' | 'className' | 'icon'>;

  let { element = $bindable(), ...props }: Props = $props();

  const FIXED = new Set(['onClick', 'onclick', 'children', 'aria-pressed', 'aria-label', 'variant', 'iconOnly', 'className', 'type', 'icon']);
  const rest = $derived(Object.fromEntries(Object.entries(props).filter(([k]) => !FIXED.has(k))));

  // Dark on the server and during hydration (as React's server snapshot), then the live value.
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
  className="theme-toggle"
  aria-label="Light theme"
  aria-pressed={theme === 'light'}
  onclick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon name="moon" size={18} /></Button
>
