<!-- Test-only: a StatGrid with two StatCards (one with a link action, one with a body), as the React spec. -->
<script lang="ts">
  import StatCard from '../../src/lib/stat-card/StatCard.svelte';
  import StatGrid from '../../src/lib/stat-card/StatGrid.svelte';
</script>

{#snippet catalogue()}<a href="#/services">Catalogue</a>{/snippet}
<StatGrid label="Key figures">
  <StatCard title="APIs & services" value="11" unit="29 operations" action={catalogue} />
  <StatCard title="Average conformance" value="78%" unit="current score" tone="warning"><p>Across 8 tested services</p></StatCard>
</StatGrid>
