import './agent-skills.css';
import { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import type { AgentProfile, AgentTaskState, Conversation, ScriptPart, ScriptStep } from '@/domain/agents';
import { Chip, Icon, type IconName, SectionLabel, SkillList, type SkillItem, SplitPane, SplitPaneMain, SplitPaneSide, TaskStateTag, TaskTimeline, type TaskTimelineNode } from '@microcks/deep-ink';

const FALLBACK_ID = '__fallback';

/** Glyph of a terminal state, written next to the state word (conversation cards). */
const END_ICON: Partial<Record<AgentTaskState, IconName>> = { completed: 'check-circle', failed: 'x-circle', rejected: 'ban', canceled: 'stop-circle' };

function Part({ part }: { part: ScriptPart }) {
  return (
    <div className="agent-part">
      <span className="agent-part-label">{part.kind === 'text' ? 'text part · text/plain' : 'data part · application/json'}</span>
      {part.kind === 'text' ? <span className="agent-part-text">{part.text}</span> : <pre className="agent-part-data">{part.body}</pre>}
    </div>
  );
}

function StepBody({ step, streamed, serviceLink }: { step: ScriptStep; streamed: boolean; serviceLink?: string }) {
  switch (step.kind) {
    case 'state':
      return (
        <>
          <span className="agent-step-line">
            <TaskStateTag state={step.state} />
            {streamed && step.event ? <span className="agent-step-event">{step.event}</span> : null}
          </span>
          {step.message ? (
            <div className="agent-bubble" data-role="agent">
              <span className="agent-bubble-head">agent · status.message</span>
              <span className="agent-part-text">{step.message}</span>
            </div>
          ) : null}
        </>
      );
    case 'user':
      return (
        <div className="agent-bubble" data-role="user">
          <span className="agent-bubble-head">
            <span className="agent-bubble-who">user · {step.messageId}</span>
            <span>{step.meta}</span>
          </span>
          {step.parts.map((p, i) => <Part key={i} part={p} />)}
        </div>
      );
    case 'call':
      return (
        <div className="agent-call">
          <Icon name="swap" size={14} />
          <span>Agent calls</span>
          {serviceLink ? <RouterLink className="agent-call-link" to={serviceLink}>API Pastry 2.0</RouterLink> : <span className="agent-call-link">API Pastry 2.0</span>}
          <span className="agent-call-path">{step.text}</span>
          <span className="agent-call-status">200</span>
          <span className="agent-call-note">served by its Microcks mock</span>
        </div>
      );
    case 'turn':
      return (
        <div className="agent-turn">
          <span className="agent-turn-title">{step.title}</span>
          <span className="agent-turn-text">{step.text}</span>
        </div>
      );
    case 'artifact':
      return (
        <div className="agent-artifact">
          <div className="agent-artifact-head">
            <Icon name="file" size={14} className="agent-artifact-icon" />
            <span className="agent-artifact-name">{step.name}</span>
            <span className="agent-artifact-id">artifactId {step.artifactId}</span>
            <span className="agent-artifact-event">{streamed ? 'TaskArtifactUpdateEvent' : 'task.artifacts'}</span>
          </div>
          {step.parts.map((p, i) => (
            <div className="agent-artifact-part" key={i}>
              <Part part={p} />
            </div>
          ))}
        </div>
      );
    case 'chunks':
      return (
        <div className="agent-chunks">
          <div className="agent-chunks-head">
            <Icon name="file" size={14} className="agent-artifact-icon" />
            <span className="agent-artifact-name">{step.name}</span>
            <span className="agent-artifact-id">artifactId {step.artifactId} · streamed in {step.chunks.length} chunks</span>
            <span className="agent-artifact-event">TaskArtifactUpdateEvent</span>
          </div>
          <ol className="agent-chunk-list" aria-label={`Chunks of ${step.name}`}>
            {step.chunks.map((c, j) => (
              <li key={c.n} className="agent-chunk" data-last={c.last ? '' : undefined} style={{ marginInlineStart: j * 18 }}>
                <span className="agent-chunk-at">chunk {c.n} · {c.at}</span>
                <span className="agent-chunk-text">“{c.text}”</span>
                <span className="agent-chunk-flags">
                  <span className="agent-flag" data-on={c.append ? '' : undefined} data-tone="a2a">append: {String(c.append)}</span>
                  <span className="agent-flag" data-on={c.last ? '' : undefined} data-tone="success">lastChunk: {String(c.last)}</span>
                </span>
              </li>
            ))}
          </ol>
          <span className="agent-chunks-note">
            Assembled artifact: parts <span className="agent-chunks-parts">[{step.chunks.map((c) => `"${c.text}"`).join(', ')}]</span>. The stream closes on <span className="demo-mono">lastChunk: true</span>, then the final status update.
          </span>
        </div>
      );
  }
}

function Script({ conversation, serviceLink }: { conversation: Conversation; serviceLink?: string }) {
  const titleId = useId();
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
    <div role="group" aria-labelledby={titleId} className="agent-script-box">
      <div className="agent-script-head">
        <span className="agent-script-title">
          <h3 id={titleId}>Task script</h3>
          <span className="agent-script-id">{conversation.id}</span>
        </span>
        <span className="agent-script-length">{conversation.method} · {conversation.length}</span>
      </div>
      <div className="agent-script-meta">
        <span>contextId <span className="agent-script-value">{conversation.contextId}</span></span>
        <span>taskId <span className="agent-script-value">{conversation.taskId}</span></span>
        <span>{conversation.turns > 1 ? 'multi-turn: both turns share contextId and taskId' : 'single turn'}</span>
        <span>match: <span className="agent-script-match">{conversation.match}</span></span>
      </div>
      <TaskTimeline label={`Lifecycle of ${conversation.id}`} nodes={nodes} selectedIndex={node} onSelectNode={setNode} />
      <ol className="agent-script" aria-label={`Script of ${conversation.id}`}>
        {conversation.steps.map((step, i) => (
          <li key={i} data-kind={step.kind} data-selected={selectedStep === i ? '' : undefined}>
            <span className="agent-at">{step.at}</span>
            <div className="agent-step" data-align={step.kind === 'user' ? 'end' : undefined}>
              <StepBody step={step} streamed={conversation.streamed} serviceLink={serviceLink} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Skills of the card with their scripted conversations (the APIExamples artifact). */
export function AgentSkillsTab({ agent }: { agent: AgentProfile }) {
  const [skillId, setSkillId] = useState(agent.skills[1]?.id ?? agent.skills[0]?.id ?? FALLBACK_ID);
  const [convId, setConvId] = useState<string | undefined>();
  const fallbackSelected = skillId === FALLBACK_ID;
  const skill = fallbackSelected ? undefined : agent.skills.find((s) => s.id === skillId);
  const convs = fallbackSelected ? [agent.fallback] : agent.conversations.filter((c) => skill?.conversationIds.includes(c.id));
  const conversation = convs.find((c) => c.id === convId) ?? convs[0];
  const serviceLink = skill?.usesService ? `/services/${skill.usesService}` : undefined;

  const items: SkillItem[] = [
    ...agent.skills.map((s) => ({
      id: s.id, name: s.name, calls: s.calls, tags: s.tags, result: s.lastTest.result, resultNote: s.lastTest.title,
      meta: `${s.conversationIds.length} ${s.conversationIds.length === 1 ? 'conversation' : 'conversations'}`,
    })),
    { id: FALLBACK_ID, name: 'No skill matched', fallback: true, calls: agent.fallbackCalls, meta: 'fallback · out-of-scope · answers rejected' },
  ];
  const pick = (id: string) => {
    setSkillId(id);
    setConvId(undefined);
  };
  return (
    <SplitPane sideMax="340px" mainWidth="560px" keepSideMax>
      <SplitPaneSide className="agent-rail">
        <SectionLabel as="p" size="sm" weight="regular" split lineHeight="snug" className="agent-rail-head"><span>{agent.skills.length} skills</span><span>calls · 24 h</span></SectionLabel>
        <SkillList label={`Skills of ${agent.name} ${agent.version}`} skills={items} selectedId={skillId} onSelectSkill={pick} />
        <p className="agent-rail-note">
          Each skill of the Agent Card is served as an operation. Its conversations come from the <span className="demo-mono">APIExamples</span> artifact, keyed by skill id.
        </p>
      </SplitPaneSide>
      <SplitPaneMain as="section" className="agent-detail" aria-label="Skill detail">
        <div className="agent-skill-head">
          <div className="agent-skill-title">
            <span className="agent-kind" data-fallback={fallbackSelected ? '' : undefined}>{fallbackSelected ? 'fallback' : 'skill'}</span>
            <h2>{fallbackSelected ? 'No skill matched' : skill?.name}</h2>
            <span className="agent-skill-id">{fallbackSelected ? agent.fallback.id : skill?.id}</span>
          </div>
          <p className="agent-skill-desc">
            {fallbackSelected
              ? 'Messages with no metadata.skillId and no conversation close enough to their first text or data part land here. The mock still answers with a well-formed task, in state rejected, with an agent message that explains its scope.'
              : skill?.description}
          </p>
        </div>
        {skill ? (
          <>
            <div className="agent-modes">
              <div className="agent-mode">
                <span className="agent-mode-label">inputModes</span>
                <span className="agent-mode-chips">{skill.inputModes.map((m) => <Chip key={m}>{m}</Chip>)}</span>
              </div>
              <span className="agent-mode-arrow"><Icon name="arrow-right-long" size={18} /></span>
              <div className="agent-mode">
                <span className="agent-mode-label">outputModes</span>
                <span className="agent-mode-chips">{skill.outputModes.map((m) => <Chip key={m}>{m}</Chip>)}</span>
              </div>
              <div className="agent-mode">
                <span className="agent-mode-label">tags</span>
                <span className="agent-mode-chips">{skill.tags.map((m) => <Chip key={m} variant="outline">{m}</Chip>)}</span>
              </div>
            </div>
            <div className="agent-prompts-block">
              <h3 className="agent-h3-sm">Sample prompts <span className="agent-h3-note">· skill.examples</span></h3>
              <ul className="agent-prompts">{skill.examples.map((p) => <li key={p}>“{p}”</li>)}</ul>
            </div>
          </>
        ) : null}
        <div className="agent-convs">
          <div className="agent-convs-head">
            <h3>Conversations</h3>
            <span className="agent-convs-count">
              {fallbackSelected ? '1 fallback conversation, not keyed by a skill' : `${convs.length} ${convs.length === 1 ? 'conversation' : 'conversations'} in api-pastry-concierge-examples.yaml`}
            </span>
          </div>
          <ul className="agent-conv-list" aria-label="Conversations of the selected skill">
            {convs.map((c) => {
              const states = c.steps.filter((s) => s.kind === 'state');
              const last = states.at(-1);
              const end = last?.kind === 'state' ? last.state : undefined;
              const on = c.id === conversation?.id;
              return (
                <li key={c.id}>
                  <button type="button" className="agent-conv" aria-pressed={on} onClick={() => setConvId(c.id)}>
                    <span className="agent-conv-id">{c.id}</span>
                    <span className="agent-conv-meta">
                      {end ? (
                        <span className="agent-conv-end" data-state={end}>
                          <Icon name={END_ICON[end] ?? 'circle'} size={13} />
                          {end}
                        </span>
                      ) : null}
                      <span>{c.turns > 1 ? `${c.turns} turns · ` : ''}{states.length} states{c.streamed ? ' · streamed' : ''}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {conversation ? <Script key={conversation.id} conversation={conversation} serviceLink={serviceLink} /> : null}
        <div className="agent-dispatcher">
          <span className="agent-dispatcher-item">
            <span className="ex-muted">Dispatcher</span>
            <span className="agent-dispatcher-rule">A2A_SKILL · metadata.skillId, else first text part</span>
          </span>
          {serviceLink ? (
            <>
              <span className="agent-dispatcher-sep" aria-hidden="true" />
              <span className="agent-dispatcher-item">
                <span className="ex-muted">uses</span>
                <RouterLink className="agent-dispatcher-link" to={serviceLink}>API Pastry 2.0 · <span className="demo-mono">GET /pastries/{'{name}'}</span></RouterLink>
              </span>
            </>
          ) : null}
          {fallbackSelected ? (
            <span className="ex-secondary">No match answers a task in state <span className="demo-mono">rejected</span>, not an HTTP error.</span>
          ) : null}
        </div>
      </SplitPaneMain>
    </SplitPane>
  );
}
