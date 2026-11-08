<script lang="ts">
 import { LiveIndicator, StatCard, StatGrid } from '@microcks/deep-ink';
 let { variant='KeyFigures' }: { variant?: string } = $props();
</script>
{#if variant === 'KeyFigures'}<StatGrid label="Key figures" style="max-width:1000px"><StatCard title="APIs & services" value="11" unit="29 operations" action={catalogue} /><StatCard title="Mock invocations today" value="638" unit="requests" action={live}><p>1,322 async messages published · last request 12 s ago</p></StatCard><StatCard title="Tests · last 7 days" value="20" unit="runs" action={history} /><StatCard title="Average conformance" value="78%" unit="current score" tone="warning" action={details}><p>Across 8 tested services · 3 never tested</p></StatCard></StatGrid>
{:else}<StatGrid label="Last 24 hours"><StatCard title="Passed" headingLevel={3} value="9" tone="success">Runs without a failure.</StatCard><StatCard title="Failed" headingLevel={3} value="3" tone="danger">Runs with a failing step.</StatCard></StatGrid>{/if}
{#snippet catalogue()}<a href="#/services">Catalogue</a>{/snippet}
{#snippet live()}<LiveIndicator variant="inline" />{/snippet}
{#snippet history()}<a href="#/tests">History</a>{/snippet}
{#snippet details()}<a href="#/usage">Details</a>{/snippet}
