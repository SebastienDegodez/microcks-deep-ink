<script lang="ts">
  import { Button, ButtonLink } from '@microcks/deep-ink';
  import type { ButtonProps, ButtonLinkProps } from '@microcks/deep-ink';
  import cases from './.artifacts/cases.json';
</script>

{#each cases as entry}
  <section class="case" id={entry.id}>
    {#if entry.kind === 'button'}
      <Button {...entry.props as ButtonProps}>{#if !('iconOnly' in entry.props)}Save <strong>changes</strong>{/if}</Button>
    {:else}
      <ButtonLink href="#destination" {...entry.props as ButtonLinkProps}>{#if !('iconOnly' in entry.props)}Save <strong>changes</strong>{/if}</ButtonLink>
    {/if}
  </section>
{/each}
