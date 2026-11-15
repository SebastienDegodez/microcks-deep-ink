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

  // Same markup as the reference demo's router link: a native <a> with the hash href. This comment stays out of the
  // markup: the demo keeps its markup comments, so one before the link would render a comment and a space with it.
</script>

<a
  {...rest}
  {href}
  onclick={(event) => {
    onclick?.(event);
    router.followLink(event, to, { replace, state, target: rest.target });
  }}
  data-discover="true">{@render children?.()}</a
>
