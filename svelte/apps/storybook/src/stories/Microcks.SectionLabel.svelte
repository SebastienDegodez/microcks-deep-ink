<script lang="ts">
 import { SectionLabel } from '@microcks/deep-ink';
 let { variant='Uses' }: { variant?: string } = $props();
</script>
{#if variant === 'Uses'}<div style="display:flex;flex-direction:column;gap:16px;max-width:360px"><SectionLabel as="h3">Endpoints</SectionLabel><div style="display:flex;flex-direction:column;gap:4px"><SectionLabel as="label" htmlFor="sl-url">Mock URL</SectionLabel><input id="sl-url" class="input" readonly value="https://microcks.acme.io/rest/API+Pastry/2.0" /></div><SectionLabel as="h2" size="sm">1 · Operation</SectionLabel><SectionLabel size="sm" weight="regular" split><span>3 operations</span><span>calls · 7 d</span></SectionLabel><SectionLabel as="h4" lineHeight="normal">Request</SectionLabel><SectionLabel size="sm" weight="regular" split lineHeight="snug"><span>Skills</span><span>4 declared</span></SectionLabel></div>{/if}
