<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import type { Clock } from '@microcks/demo-core/application/ports';
  import type { UseCases } from '@microcks/demo-core/application/use-cases';
  import AppLayout from './AppLayout.svelte';
  import Navigate from './Navigate.svelte';
  import RouteErrorPage from './RouteErrorPage.svelte';
  import UseCasesProvider from './UseCasesProvider.svelte';
  import { provideRouter, type Router } from './router.svelte.js';

  /**
   * Root of the demo: the use cases, the hash router and the shell. The page area has an error boundary
   * (a page that throws renders the route error page inside the shell); it resets when the location changes.
   * The app owns the router once mounted: it stops listening to the history when the app is destroyed.
   */
  let { useCases, clock, router }: { useCases: UseCases; clock: Clock; router: Router } = $props();

  // svelte-ignore state_referenced_locally
  provideRouter(router);
  onDestroy(() => router.destroy());

  const leaf = $derived(router.matches[router.matches.length - 1]);
  const Page = $derived(router.page);

  let resetBoundary: (() => void) | undefined;
  $effect(() => {
    void router.location;
    untrack(() => {
      const reset = resetBoundary;
      resetBoundary = undefined;
      reset?.();
    });
  });
</script>

<UseCasesProvider {useCases} {clock}
  >{#if router.ready}<AppLayout
      >{#if router.failure}<RouteErrorPage error={router.failure.error} />{:else}<svelte:boundary
          onerror={(_error, reset) => (resetBoundary = reset)}
          >{#if leaf?.route.redirect}<Navigate to={leaf.route.redirect} replace />{:else if Page}{#key leaf?.route.id}<Page
              />{/key}{/if}{#snippet failed(error)}<RouteErrorPage {error} />{/snippet}</svelte:boundary
        >{/if}</AppLayout
    >{/if}</UseCasesProvider
>
