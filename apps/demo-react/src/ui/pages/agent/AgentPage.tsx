import '@microcks/demo-styles/pages/explore-kit/explore.css';
import '@microcks/demo-styles/pages/agent/agent.css';
import '@microcks/demo-styles/pages/agent/agent-header.css';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { formatDay, formatHourMinute } from '@/domain/importing';
import { PageHeader, useAnnounce, useQuery, usePageTitle, useUseCases } from '@/ui/app';
import { ApiBadge, Button, Chip, LiveIndicator, Menu, ProjectionPill, TabPanel, Tabs } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { AgentCardTab } from './AgentCardTab';
import { AgentMockTab } from './AgentMockTab';
import { AgentSkillsTab } from './AgentSkillsTab';
import { AgentTasksTab } from './AgentTasksTab';
import { importHost, mockLiveLabel, runScore, runTitle, tabOf } from './page';

/** Screen 18: an A2A agent imported from its Agent Card. Rendered by the service route when the protocol is A2A. */
export default function AgentPage() {
  const { serviceId = '', tab } = useParams();
  const navigate = useNavigate();
  const uc = useUseCases();
  const announce = useAnnounce();
  const tabId = tabOf(tab);
  const agent = useQuery(() => uc.agents.getAgent(serviceId), [uc, serviceId]);
  const tasks = useQuery(() => uc.agents.listTasks(serviceId), [uc, serviceId]);
  const runId = agent.data?.lastTest.runId;
  const run = useQuery(() => (runId ? uc.agents.getTestRun(runId) : Promise.resolve(undefined)), [uc, runId]);
  usePageTitle(agent.data ? `${agent.data.name} ${agent.data.version} · Microcks` : 'Agent · Microcks');

  if (agent.status === 'error' && !agent.data) {
    return (
      <>
        <PageHeader title="Agent" />
        <ErrorBlock error={agent.error} what="The agent" onRetry={agent.reload} />
      </>
    );
  }
  const a = agent.data;
  if (!a) {
    return (
      <>
        <PageHeader title="Agent" />
        <LoadingBlock label="the agent" />
      </>
    );
  }
  const goTab = (id: string) => navigate(`/services/${serviceId}/${id}`);
  const streams = a.card.capabilities.streaming;
  const push = a.card.capabilities.pushNotifications;
  const conversations = a.conversations.length;
  const score = runScore(a, run.data);

  return (
    <div className="ex-stack agent-page">
      <PageHeader
        variant="badge"
        align="start"
        title={<ApiBadge protocol="A2A" name={`${a.name} ${a.version}`} size="xl" />}
        breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: `${a.name} ${a.version}` }]}
        badge={
          <>
            <ProjectionPill title="A2A support is a proposed protocol module for Microcks v2" />
            <LiveIndicator label={mockLiveLabel(tasks.data)} />
          </>
        }
        description={a.description}
        descriptionTone="secondary"
        actions={
          <>
            <Button asChild variant="primary" icon="play"><RouterLink to={`/tests/agent?service=${serviceId}`}>Run a test</RouterLink></Button>
            <Menu
              label="More actions"
              icon="more-vertical"
              iconOnly
              variant="secondary"
              align="end"
              items={[
                { id: 'labels', label: 'Edit labels', onSelect: () => announce('Edit labels is not part of this demo.') },
                { id: 'card', label: 'View the Agent Card', onSelect: () => goTab('card') },
                { id: 'download', label: 'Download conversations (APIExamples)', onSelect: () => announce('Download is not part of this demo.') },
                { id: 'refetch', label: 'Re-fetch the card from staging', onSelect: () => announce('The card is fetched again in the real product.') },
                { id: 'delete', label: 'Delete Service', danger: true, separatorBefore: true, onSelect: () => announce('Delete is disabled in the demo.') },
              ]}
            />
          </>
        }
      >
        <div className="agent-head-row">
          {a.labels.map((l) => <Chip key={l} variant="outline">{l}</Chip>)}
          <span className="agent-import-line">
            A2A spec {a.specVersion} · imported {formatDay(a.importedAt)} at {formatHourMinute(a.importedAt)} from <span className="demo-mono">{importHost(a.importedFrom)}</span>
          </span>
        </div>
        <div className="agent-head-row" data-gap="badges">
          <ApiBadge label="skills" value={String(a.skills.length)} status="protocol" protocol="A2A" />
          <ApiBadge label="conversations" value={String(conversations)} status="action" />
          <RouterLink className="agent-badge-link" to={`/tests/agent/${a.lastTest.runId}`} title={runTitle(a, run.data)}>
            <ApiBadge label="last test" value={score} status={a.lastTest.result === 'failed' ? 'danger' : 'success'} icon={a.lastTest.result === 'failed' ? 'close-sm' : 'check'} />
          </RouterLink>
          {streams ? <ApiBadge label="streaming" status="success" icon="check" iconLabel="supported" /> : <ApiBadge label="streaming" value="no" />}
          {push ? <ApiBadge label="push" status="success" icon="check" iconLabel="supported" /> : <ApiBadge label="push" value="no" />}
        </div>
      </PageHeader>
      <Tabs
        label="Agent sections"
        idPrefix="agent"
        value={tabId}
        onChange={goTab}
        items={[
          { id: 'skills', label: 'Skills', count: a.skills.length },
          { id: 'card', label: 'Agent Card' },
          { id: 'mock', label: 'Mock endpoints', count: a.transports.length },
          { id: 'tasks', label: 'Tasks', count: tasks.data?.length, live: true },
        ]}
      >
        <TabPanel id="skills" idPrefix="agent" value={tabId}>
          <AgentSkillsTab agent={a} />
        </TabPanel>
        <TabPanel id="card" idPrefix="agent" value={tabId}>
          <AgentCardTab agent={a} />
        </TabPanel>
        <TabPanel id="mock" idPrefix="agent" value={tabId}>
          <AgentMockTab agent={a} />
        </TabPanel>
        <TabPanel id="tasks" idPrefix="agent" value={tabId}>
          <AgentTasksTab serviceId={serviceId} initial={tasks.data} onChanged={tasks.reload} />
        </TabPanel>
      </Tabs>
    </div>
  );
}
