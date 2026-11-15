<script lang="ts">
  import { ButtonLink, type ButtonLinkProps } from '@microcks/deep-ink';
  import { useRouter, type To } from './router.svelte.js';

  type Props = Omit<ButtonLinkProps, 'href'> & {
    /** Target route, as for `RouterLink`. */
    to: To;
    /** Replace the history entry. Default: only when the link points at the current location. */
    replace?: boolean;
    state?: unknown;
  };

  let { to, replace, state, onclick, element = $bindable(), ...rest }: Props = $props();

  const router = useRouter();
  const href = $derived(router.href(to));

  // A deep-ink button that navigates like `RouterLink`: the reference demo's `<Button asChild><Link …/></Button>`.
  // Kept out of the markup, as in `RouterLink`, so no comment and space render before the button.
</script>

<ButtonLink
  {...rest}
  bind:element
  {href}
  onclick={(event) => {
    onclick?.(event);
    router.followLink(event, to, { replace, state, target: rest.target });
  }}
  data-discover="true"
/>
