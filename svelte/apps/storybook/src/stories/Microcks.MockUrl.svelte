<script lang="ts">
 import { MockUrl } from '@microcks/deep-ink';
 import { MOCK_BASE } from '@microcks-deep-ink/storybook-shared/fixtures';
 let { variant = 'Default' }: { variant?: string } = $props();
</script>
{#if variant === 'Default'}<div style="max-width:720px"><MockUrl url={`${MOCK_BASE}/pastries`} /></div>
{:else if variant === 'AgentReady'}<div style="max-width:720px"><MockUrl url={`${MOCK_BASE}/pastries/Millefeuille`} mcpTool="getPastry" /></div>
{:else}<div style="max-width:720px"><MockUrl bare method="PATCH" url={`${MOCK_BASE}/pastries/Millefeuille`} /></div>{/if}
