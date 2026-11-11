<script lang="ts">
  import { PageHeader, RouterLink, usePageTitle } from '@/ui/app';

  usePageTitle('Page not found · Microcks');
</script>

<PageHeader title="Page not found" /><p>This address does not match any screen of the demo.</p><p>
  <RouterLink to="/">Back to the Cockpit</RouterLink> or <RouterLink to="/map">open the screen map</RouterLink>.
</p>
