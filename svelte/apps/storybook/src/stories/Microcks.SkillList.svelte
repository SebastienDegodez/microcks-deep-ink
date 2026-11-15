<script lang="ts">
 import { SkillList } from '@microcks/deep-ink';
 import { AGENT_SKILLS } from '@microcks-deep-ink/storybook-shared/fixtures';
 let { variant='Default' }: { variant?: string } = $props(); let selected=$state('order-pastry');

</script>
{#if variant === 'Default'}<SkillList label="Skills of Pastry concierge 1.0" skills={AGENT_SKILLS} />{:else}<div class="sb-col" style="max-width:360px"><SkillList label="Skills of Pastry concierge 1.0" skills={AGENT_SKILLS} selectedId={selected} onselectskill={(id)=>selected=id} /><p role="status">Selected: {selected}</p></div>{/if}
