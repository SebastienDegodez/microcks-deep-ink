<script lang="ts">
  import { Menu } from '@microcks/deep-ink';
</script>

<Menu label="More actions" icon="more-vertical" iconOnly items={[
        { id: 'copy', label: 'Copy workflowId' },
        { id: 'dl', label: 'Download Arazzo document' },
        { id: 'del', label: 'Delete workflow', danger: true, disabled: true, separatorBefore: true, description: 'Workflows are removed with their Arazzo document.' },
      ]} />
