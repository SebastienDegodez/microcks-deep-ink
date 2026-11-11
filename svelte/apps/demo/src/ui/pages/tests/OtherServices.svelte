<script lang="ts">
  import { ApiBadge, Icon } from '@microcks/deep-ink';
  import { RouterLink, useQuery, useUseCases } from '@/ui/app';
  import { testRunHref } from '@/ui/app/format';

  /** The agent tests live on their own screen: point to the latest one from the history of any other service. */
  const uc = useUseCases();
  const agent = useQuery(
    async () => {
      const [svc] = await uc.catalog.listServices({ protocols: ['A2A'] });
      const [run] = svc ? await uc.testing.listForService(svc.id) : [];
      return svc && run ? { svc, run } : undefined;
    },
    () => [uc],
  );
</script>

{#if agent.data}{@const svc = agent.data.svc}{@const run = agent.data.run}<RouterLink to={testRunHref(run)} class="tests-other"
    ><span>Other services:</span><ApiBadge protocol={svc.protocol} name={svc.name} version={svc.version} size="sm" /><span
      class="tests-other-run"
      data-result={run.result}>run #<!---->{run.id}<!---->{' '}<!---->{run.result}<!---->{' '}<!---->{run.passed}<!---->/<!---->{run.total}</span
    ><Icon name="arrow-right" size={13} class="tests-other-arrow" /></RouterLink
  >{/if}
