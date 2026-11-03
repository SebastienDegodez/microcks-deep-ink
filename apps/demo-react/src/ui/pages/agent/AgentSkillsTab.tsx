import { useState } from 'react';
import type { AgentProfile, Conversation, ScriptPart, ScriptStep } from '@/domain/agents';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { SkillList, type SkillItem } from '@/ui/components/ui/skill-list';
import { TaskStateTag, TaskTimeline, type TaskTimelineNode } from '@/ui/components/ui/task-timeline';

const FALLBACK_ID = '__fallback';

function Parts({ parts }: { parts: ScriptPart[] }) {
  return (
    <>
      {parts.map((p, i) => (
        <div className="ag-part" key={i}>
          <span className="ex-small ex-muted">{p.kind === 'text' ? 'text · text/plain' : 'data · application/json'}</span>
          {p.kind === 'text' ? <p style={{ margin: 0 }}>{p.text}</p> : <pre>{p.body}</pre>}
        </div>
      ))}
    </>
  );
}

function ScriptRow({ step, streamed, selected }: { step: ScriptStep; streamed: boolean; selected: boolean }) {
  const common = { 'data-kind': step.kind, 'data-selected': selected ? '' : undefined } as const;
  switch (step.kind) {
    case 'state':
      return (
        <li {...common}>
          <span className="ex-row">
            <span className="ex-small ex-mono ex-muted">{step.at}</span>
            <TaskStateTag state={step.state} />
            {streamed && step.event ? <span className="ex-small ex-mono ex-secondary">{step.event}</span> : null}
          </span>
          {step.message ? <span className="ex-small"><span className="ex-muted">agent · status.message: </span>{step.message}</span> : null}
        </li>
      );
    case 'user':
      return (
        <li {...common}>
          <span className="ex-small ex-muted"><span className="ex-mono">{step.at}</span> · user · <span className="ex-mono">{step.messageId}</span> · {step.meta}</span>
          <Parts parts={step.parts} />
        </li>
      );
    case 'call':
      return (
        <li {...common}>
          <span className="ex-small ex-muted"><span className="ex-mono">{step.at}</span> · Agent calls API Pastry 2.0, served by its Microcks mock</span>
          <span className="ex-mono">{step.text}</span>
        </li>
      );
    case 'turn':
      return (
        <li {...common}>
          <strong>{step.title}</strong>
          <span className="ex-small ex-secondary">{step.text}</span>
        </li>
      );
    case 'artifact':
      return (
        <li {...common}>
          <span className="ex-small ex-muted"><span className="ex-mono">{step.at}</span> · artifact <strong>{step.name}</strong> · <span className="ex-mono">{step.artifactId}</span> · {streamed ? 'TaskArtifactUpdateEvent' : 'task.artifacts'}</span>
          <Parts parts={step.parts} />
        </li>
      );
    case 'chunks':
      return (
        <li {...common}>
          <span className="ex-small ex-muted"><span className="ex-mono">{step.at}</span> · artifact <strong>{step.name}</strong> · <span className="ex-mono">{step.artifactId}</span> · TaskArtifactUpdateEvent</span>
          <ol className="ex-plain-list">
            {step.chunks.map((c) => (
              <li key={c.n} className="ex-small">
                <span className="ex-mono">chunk {c.n} · {c.at}</span> · “{c.text}” · <span className="ex-mono">append: {String(c.append)}</span> · <span className="ex-mono">lastChunk: {String(c.last)}</span>
              </li>
            ))}
          </ol>
          <span className="ex-small ex-secondary">
            Assembled artifact: parts <span className="ex-mono">[{step.chunks.map((c) => `"${c.text}"`).join(', ')}]</span>. The stream closes on <span className="ex-mono">lastChunk: true</span>, then the final status update.
          </span>
        </li>
      );
  }
}

function Script({ conversation }: { conversation: Conversation }) {
  const [node, setNode] = useState<number | undefined>();
  const stateIdx = conversation.steps.flatMap((s, i) => (s.kind === 'state' ? [i] : []));
  const nodes: TaskTimelineNode[] = stateIdx.map((ri, j) => {
    const step = conversation.steps[ri];
    const between = j > 0 ? conversation.steps.slice((stateIdx[j - 1] ?? 0) + 1, ri) : [];
    const reply = between.find((b) => b.kind === 'user');
    const first = reply && reply.kind === 'user' ? reply.parts[0] : undefined;
    return {
      state: step?.kind === 'state' ? step.state : 'submitted',
      at: step?.at ?? '',
      connector: first && first.kind === 'text' ? `reply “${first.text}”` : undefined,
    };
  });
  const selectedStep = node === undefined ? undefined : stateIdx[node];
  return (
    <div className="ex-stack">
      <p className="ex-small ex-secondary" style={{ margin: 0 }}>
        <span className="ex-mono">{conversation.method}</span> · {conversation.length} · contextId <span className="ex-mono">{conversation.contextId}</span> · taskId <span className="ex-mono">{conversation.taskId}</span> ·{' '}
        {conversation.turns > 1 ? 'multi-turn: both turns share contextId and taskId' : 'single turn'} · match: {conversation.match}
      </p>
      <TaskTimeline label={`Lifecycle of ${conversation.id}`} nodes={nodes} selectedIndex={node} onSelectNode={setNode} />
      <ol className="ag-script" aria-label={`Script of ${conversation.id}`}>
        {conversation.steps.map((step, i) => <ScriptRow key={i} step={step} streamed={conversation.streamed} selected={selectedStep === i} />)}
      </ol>
    </div>
  );
}

/** Skills of the card with their scripted conversations (the APIExamples artifact). */
export function AgentSkillsTab({ agent }: { agent: AgentProfile }) {
  const [skillId, setSkillId] = useState(agent.skills[1]?.id ?? agent.skills[0]?.id ?? FALLBACK_ID);
  const [convId, setConvId] = useState<string | undefined>();
  const fallbackSelected = skillId === FALLBACK_ID;
  const skill = agent.skills.find((s) => s.id === skillId);
  const convs = fallbackSelected ? [agent.fallback] : agent.conversations.filter((c) => skill?.conversationIds.includes(c.id));
  const conversation = convs.find((c) => c.id === convId) ?? convs[0];

  const items: SkillItem[] = [
    ...agent.skills.map((s) => ({
      id: s.id, name: s.name, calls: s.calls, tags: s.tags, result: s.lastTest.result, resultNote: s.lastTest.title,
      meta: `${s.conversationIds.length} ${s.conversationIds.length === 1 ? 'conversation' : 'conversations'}`,
    })),
    { id: FALLBACK_ID, name: 'No skill matched', fallback: true, meta: 'fallback · out-of-scope · answers rejected' },
  ];
  const pick = (id: string) => {
    setSkillId(id);
    setConvId(undefined);
  };
  return (
    <div className="ag-layout">
      <div className="ex-stack">
        <p className="ex-row-between ex-small ex-secondary" style={{ margin: 0 }}><span>{agent.skills.length} skills</span><span>calls · 24 h</span></p>
        <SkillList label={`Skills of ${agent.name} ${agent.version}`} skills={items} selectedId={skillId} onSelectSkill={pick} />
        <p className="ex-small ex-secondary" style={{ margin: 0 }}>
          Each skill of the Agent Card is served as an operation. Its conversations come from the APIExamples artifact, keyed by skill id.
        </p>
      </div>
      <div className="ex-stack" role="region" aria-label="Skill detail">
        <div className="ex-stack" style={{ gap: 8 }}>
          <h2 style={{ margin: 0 }}>
            {fallbackSelected ? 'No skill matched' : skill?.name} <Chip variant="outline">{fallbackSelected ? 'fallback' : 'skill'}</Chip>
          </h2>
          <p className="ex-mono ex-small ex-secondary" style={{ margin: 0 }}>{fallbackSelected ? 'out-of-scope' : skill?.id}</p>
          <p style={{ margin: 0 }}>
            {fallbackSelected
              ? 'Messages with no metadata.skillId and no conversation close enough to their first text or data part land here. The mock still answers with a well-formed task, in state rejected, with an agent message that explains its scope.'
              : skill?.description}
          </p>
          {skill ? (
            <dl className="dl">
              <div><dt>inputModes</dt><dd className="ag-chips">{skill.inputModes.map((m) => <Chip key={m} variant="outline">{m}</Chip>)}</dd></div>
              <div><dt>outputModes</dt><dd className="ag-chips">{skill.outputModes.map((m) => <Chip key={m} variant="outline">{m}</Chip>)}</dd></div>
              <div><dt>tags</dt><dd className="ag-chips">{skill.tags.map((m) => <Chip key={m} variant="outline">{m}</Chip>)}</dd></div>
              <div><dt>Sample prompts · skill.examples</dt><dd><ul className="ex-plain-list">{skill.examples.map((p) => <li key={p}>“{p}”</li>)}</ul></dd></div>
            </dl>
          ) : null}
        </div>
        <section className="ex-stack" aria-label="Conversations">
          <h3 style={{ margin: 0 }}>Conversations</h3>
          <p className="ex-small ex-secondary" style={{ margin: 0 }}>
            {fallbackSelected ? '1 fallback conversation, not keyed by a skill' : `${convs.length} ${convs.length === 1 ? 'conversation' : 'conversations'} in api-pastry-concierge-examples.yaml`}
          </p>
          <ul className="ex-plain-list" aria-label="Conversations of the selected skill">
            {convs.map((c) => {
              const states = c.steps.filter((s) => s.kind === 'state');
              const last = states.at(-1);
              const on = c.id === conversation?.id;
              return (
                <li key={c.id}>
                  <Button variant={on ? 'secondary' : 'ghost'} aria-pressed={on} onClick={() => setConvId(c.id)} style={{ width: '100%', justifyContent: 'flex-start' }}>
                    <span className="ex-mono">{c.id}</span>
                    {last?.kind === 'state' ? <TaskStateTag state={last.state} /> : null}
                    <span className="ex-small ex-secondary">{c.turns > 1 ? `${c.turns} turns · ` : ''}{states.length} states{c.streamed ? ' · streamed' : ''}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
        {conversation ? (
          <section className="ex-stack" aria-label="Task script">
            <h3 style={{ margin: 0 }}>Task script · <span className="ex-mono">{conversation.id}</span></h3>
            <Script key={conversation.id} conversation={conversation} />
          </section>
        ) : null}
        <Callout tone="info" title="Dispatcher">
          <p>
            A2A_SKILL · metadata.skillId, else first text part.
            {skill?.usesService ? ' This skill uses API Pastry 2.0, served by its own Microcks mock.' : ''}
            {fallbackSelected ? ' No match answers a task in state rejected, not an HTTP error.' : ''}
          </p>
        </Callout>
      </div>
    </div>
  );
}
