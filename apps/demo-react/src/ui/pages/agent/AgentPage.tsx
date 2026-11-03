import '../explore-kit/explore.css';
import './agent.css';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { formatDay } from '@/domain/importing';
import { PageHeader, useAnnounce, useQuery, usePageTitle, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Chip } from '@/ui/components/ui/chip';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { Menu } from '@/ui/components/ui/menu';
import { TabPanel, Tabs } from '@/ui/components/ui/tabs';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';
import { AgentCardTab } from './AgentCardTab';
import { AgentMockTab } from './AgentMockTab';
import { AgentSkillsTab } from './AgentSkillsTab';
import { AgentTasksTab } from './AgentTasksTab';

type TabId = 'skills' | 'card' | 'mock' | 'tasks';
const TAB_IDS: TabId[] = ['skills', 'card', 'mock', 'tasks'];

/** Screen 18: an A2A agent imported from its Agent Card. Rendered by the service route when the protocol is A2A. */
export default function AgentPage() {
  const { serviceId = '', tab } = useParams();
  const navigate = useNavigate();
  const uc = useUseCases();
  const announce = useAnnounce();
  const tabId: TabId = TAB_IDS.includes(tab as TabId) ? (tab as TabId) : 'skills';
  const agent = useQuery(() => uc.agents.getAgent(serviceId), [uc, serviceId]);
  const tasks = useQuery(() => uc.agents.listTasks(serviceId), [uc, serviceId]);
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
  const openTasks = (tasks.data ?? []).filter((t) => !['completed', 'failed', 'rejected', 'canceled'].includes(t.state)).length;
  const streams = a.card.capabilities.streaming;
  const push = a.card.capabilities.pushNotifications;
  const conversations = a.conversations.length;

  return (
    <div className="ex-stack">
      <PageHeader
        title={`${a.name} ${a.version}`}
        eyebrow={<span role="group" aria-label="Breadcrumb"><RouterLink to="/services">APIs &amp; Services</RouterLink> / <span aria-current="page">{a.name} {a.version}</span></span>}
        badge={<ApiBadge protocol="A2A" name={a.name} version={a.version} />}
        actions={
          <>
            <Button asChild icon="play"><RouterLink to={`/tests/agent?service=${serviceId}`}>Test the agent</RouterLink></Button>
            <Menu
              label="More actions"
              icon="more"
              iconOnly
              variant="secondary"
              align="end"
              items={[
                { id: 'labels', label: 'Edit labels', onSelect: () => announce('Edit labels is not part of this demo.') },
                { id: 'card', label: 'View the Agent Card', onSelect: () => goTab('card') },
                { id: 'download', label: 'Download conversations (APIExamples)', onSelect: () => announce('Download is not part of this demo.') },
                { id: 'refetch', label: 'Re-fetch the card from staging', onSelect: () => announce('The card is fetched again in the real product.') },
                { id: 'delete', label: 'Delete Service', danger: true, onSelect: () => announce('Delete is disabled in the demo.') },
              ]}
            />
          </>
        }
      />
      <div className="ex-stack" style={{ gap: 8 }}>
        <p className="ex-row ex-secondary" style={{ margin: 0 }}>
          <Chip variant="outline">Projection · v2 module</Chip>
          <LiveIndicator label={`mock live · ${openTasks} open ${openTasks === 1 ? 'task' : 'tasks'}`} />
        </p>
        <p style={{ margin: 0 }}>{a.description}</p>
        <div className="ex-row">
          {a.labels.map((l) => <Chip key={l} variant="outline">{l}</Chip>)}
          <span className="ex-small ex-muted">
            A2A spec {a.specVersion} · imported {formatDay(a.importedAt)} from <span className="ex-mono">{a.importedFrom.replace(/^https?:\/\//, '')}</span>
          </span>
        </div>
        <div className="ex-row">
          <ApiBadge label="skills" value={String(a.skills.length)} size="sm" />
          <ApiBadge label="conversations" value={String(conversations)} size="sm" />
          <ApiBadge label="last test" value={a.lastTest.result === 'failed' ? `#${a.lastTest.runId} failed` : `#${a.lastTest.runId} passed`} status={a.lastTest.result === 'failed' ? 'danger' : 'success'} size="sm" />
          <ApiBadge label="streaming" value={streams ? 'yes' : 'no'} size="sm" />
          <ApiBadge label="push" value={push ? 'yes' : 'no'} size="sm" />
        </div>
      </div>
      <Tabs
        label="Agent sections"
        idPrefix="agent"
        value={tabId}
        onChange={goTab}
        items={[
          { id: 'skills', label: 'Skills', count: a.skills.length },
          { id: 'card', label: 'Agent Card' },
          { id: 'mock', label: 'Mock endpoints', count: a.transports.length },
          { id: 'tasks', label: 'Tasks', count: tasks.data?.length },
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
