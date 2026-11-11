<script lang="ts">
  import { PageHeader, usePageTitle } from '@/ui/app';
  import { useRouter } from '@/ui/app/router.svelte.js';
  import { ROUTES } from '@/ui/app/routes';

  /** Placeholder of a screen that is not ported yet: its title only. Removed once every page is ported. */
  const router = useRouter();
  const route = $derived(ROUTES.find((r) => r.id === router.matches[router.matches.length - 1]?.route.id));
  const title = $derived(route?.title ?? 'Microcks');

  usePageTitle(() => title);
</script>

<PageHeader title={title.replace(/ · Microcks$/, '')} />
