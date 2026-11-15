<script lang="ts">
  import '@microcks/demo-styles/pages/admin/configuration.css';
  import { Icon } from '@microcks/deep-ink';
  import { useQuery, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';

  /** Read-only: Microcks reads these values at start-up. */
  const uc = useUseCases();
  const flags = useQuery(() => uc.govern.listFlags());
</script>

{#if flags.status === 'error'}<ErrorBlock error={flags.error} what="Configuration" onretry={flags.reload} />{:else if !flags.data}<LoadingBlock
    label="configuration"
  />{:else}<div class="ad-tab"
    ><div role="note" class="ad-lock-note"
      ><Icon name="lock" size={14} class="ad-lock-icon" /><span
        >Read-only. These values come from <span class="demo-mono">application.properties</span> and <span class="demo-mono"
          >features.properties</span
        >, or from your Helm values or Operator resource. Change them there and restart Microcks.</span
      ></div
    ><ul class="ad-card ad-flags" aria-label="Features and their configuration"
      >{#each flags.data as f (f.id)}<li class="ad-flag"
          ><span class="ad-flag-text"><span class="ad-flag-label">{f.label}</span><span class="ad-flag-desc">{f.description}</span></span><span
            class="ad-flag-state"
            data-on={f.enabled ? '' : undefined}
            ><Icon name={f.enabled ? 'check' : 'circle'} size={14} stroke-width={f.enabled ? 2.6 : 2} />{f.enabled ? 'Enabled' : 'Disabled'}</span
          ><span class="ad-flag-value">{f.value ?? '—'}</span><span class="ad-flag-key">{f.key}</span></li
        >{/each}</ul
    ></div
  >{/if}
