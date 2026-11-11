<script lang="ts">
  import '@microcks/demo-styles/pages/explore-kit/explore.css';
  import '@microcks/demo-styles/pages/agent/agent.css';
  import '@microcks/demo-styles/pages/agent/agent-header.css';
  import { formatDay, formatHourMinute } from '@microcks/demo-core/domain/importing';
  import { ApiBadge, Chip, LiveIndicator, Menu, ProjectionPill, TabPanel, Tabs } from '@microcks/deep-ink';
  import { ButtonRouterLink, PageHeader, RouterLink, useAnnounce, useNavigate, usePageTitle, useParams, useQuery, useUseCases } from '@/ui/app';
  import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
  import AgentCardTab from './AgentCardTab.svelte';
  import AgentMockTab from './AgentMockTab.svelte';
  import AgentSkillsTab from './AgentSkillsTab.svelte';
  import AgentTasksTab from './AgentTasksTab.svelte';
  import { importHost, mockLiveLabel, runScore, runTitle, tabOf } from './page';

  /** Screen 18: an A2A agent imported from its Agent Card. Rendered by the service route when the protocol is A2A. */
  const params = useParams();
  const navigate = useNavigate();
  const uc = useUseCases();
  const announce = useAnnounce();
  const serviceId = $derived(params.serviceId ?? '');
  const tabId = $derived(tabOf(params.tab));
  const agent = useQuery(() => uc.agents.getAgent(serviceId), () => [uc, serviceId]);
  const tasks = useQuery(() => uc.agents.listTasks(serviceId), () => [uc, serviceId]);
  const runId = $derived(agent.data?.lastTest.runId);
  const run = useQuery(() => (runId ? uc.agents.getTestRun(runId) : Promise.resolve(undefined)), () => [uc, runId]);
  usePageTitle(() => (agent.data ? `${agent.data.name} ${agent.data.version} · Microcks` : 'Agent · Microcks'));

  const a = $derived(agent.data);
  const goTab = (id: string) => navigate(`/services/${serviceId}/${id}`);
  const liveLabel = $derived(mockLiveLabel(tasks.data));
  const score = $derived(a ? runScore(a, run.data) : '');
  const lastRunTitle = $derived(a ? runTitle(a, run.data) : '');
</script>

{#if agent.status === 'error' && !agent.data}<PageHeader title="Agent" /><ErrorBlock
    error={agent.error}
    what="The agent"
    onretry={agent.reload}
  />{:else if !a}<PageHeader title="Agent" /><LoadingBlock label="the agent" />{:else}
  {#snippet title()}<ApiBadge protocol="A2A" name={`${a.name} ${a.version}`} size="xl" />{/snippet}
  {#snippet badge()}<ProjectionPill title="A2A support is a proposed protocol module for Microcks v2" /><LiveIndicator label={liveLabel} />{/snippet}
  {#snippet actions()}<ButtonRouterLink variant="primary" icon="play" to={`/tests/agent?service=${serviceId}`}>Run a test</ButtonRouterLink
    ><Menu
      label="More actions"
      icon="more-vertical"
      iconOnly
      variant="secondary"
      align="end"
      items={[
        { id: 'labels', label: 'Edit labels', onselect: () => announce('Edit labels is not part of this demo.') },
        { id: 'card', label: 'View the Agent Card', onselect: () => goTab('card') },
        { id: 'download', label: 'Download conversations (APIExamples)', onselect: () => announce('Download is not part of this demo.') },
        { id: 'refetch', label: 'Re-fetch the card from staging', onselect: () => announce('The card is fetched again in the real product.') },
        { id: 'delete', label: 'Delete Service', danger: true, separatorBefore: true, onselect: () => announce('Delete is disabled in the demo.') },
      ]}
    />{/snippet}
  <div class="ex-stack agent-page"
    ><PageHeader
      variant="badge"
      align="start"
      {title}
      breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${a.name} ${a.version}` }]}
      {badge}
      description={a.description}
      descriptionTone="secondary"
      {actions}
      ><div class="agent-head-row"
        >{#each a.labels as l (l)}<Chip variant="outline">{l}</Chip>{/each}<span class="agent-import-line"
          >A2A spec <!---->{a.specVersion}<!----> · imported <!---->{formatDay(a.importedAt)}<!----> at <!---->{formatHourMinute(a.importedAt)}<!----> from <span
            class="demo-mono">{importHost(a.importedFrom)}</span
          ></span
        ></div
      ><div class="agent-head-row" data-gap="badges"
        ><ApiBadge label="skills" value={String(a.skills.length)} status="protocol" protocol="A2A" /><ApiBadge
          label="conversations"
          value={String(a.conversations.length)}
          status="action"
        /><RouterLink class="agent-badge-link" to={`/tests/agent/${a.lastTest.runId}`} title={lastRunTitle}
          ><ApiBadge
            label="last test"
            value={score}
            status={a.lastTest.result === 'failed' ? 'danger' : 'success'}
            icon={a.lastTest.result === 'failed' ? 'close-sm' : 'check'}
          /></RouterLink
        >{#if a.card.capabilities.streaming}<ApiBadge label="streaming" status="success" icon="check" iconLabel="supported" />{:else}<ApiBadge
            label="streaming"
            value="no"
          />{/if}{#if a.card.capabilities.pushNotifications}<ApiBadge label="push" status="success" icon="check" iconLabel="supported" />{:else}<ApiBadge
            label="push"
            value="no"
          />{/if}</div
      ></PageHeader
    ><Tabs
      label="Agent sections"
      idPrefix="agent"
      value={tabId}
      onchange={goTab}
      items={[
        { id: 'skills', label: 'Skills', count: a.skills.length },
        { id: 'card', label: 'Agent Card' },
        { id: 'mock', label: 'Mock endpoints', count: a.transports.length },
        { id: 'tasks', label: 'Tasks', count: tasks.data?.length, live: true },
      ]}
      ><TabPanel id="skills" idPrefix="agent" value={tabId}><AgentSkillsTab agent={a} /></TabPanel
      ><TabPanel id="card" idPrefix="agent" value={tabId}><AgentCardTab agent={a} /></TabPanel
      ><TabPanel id="mock" idPrefix="agent" value={tabId}><AgentMockTab agent={a} /></TabPanel
      ><TabPanel id="tasks" idPrefix="agent" value={tabId}><AgentTasksTab {serviceId} initial={tasks.data} onchanged={tasks.reload} /></TabPanel
      ></Tabs
    ></div
  >
{/if}
