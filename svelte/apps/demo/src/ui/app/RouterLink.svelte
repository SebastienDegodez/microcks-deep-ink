<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import { useRouter, type To } from './router.svelte.js';

  type Props = Omit<HTMLAnchorAttributes, 'href' | 'children'> & {
    /** Target route: absolute (`/services`), relative (`runs`, `../`) or a query (`?tab=x`). */
    to: To;
    /** Replace the history entry. Default: only when the link points at the current location. */
    replace?: boolean;
    state?: unknown;
    children?: Snippet;
  };

  let { to, replace, state, onclick, children, ...rest }: Props = $props();

  const router = useRouter();
  const href = $derived(router.href(to));
</script>

<!-- Same markup as the reference demo's router link: a native <a> with the hash href. -->
<a
  {...rest}
  {href}
  onclick={(event) => {
    onclick?.(event);
    router.followLink(event, to, { replace, state, target: rest.target });
  }}
  data-discover="true">{@render children?.()}</a
>
