<script lang="ts">
  import '@microcks/demo-styles/pages/agent/agent-skills.css';
  import { untrack } from 'svelte';
  import type { AgentProfile } from '@microcks/demo-core/domain/agents';
  import { Chip, Icon, SectionLabel, SkillList, SplitPane, SplitPaneMain, SplitPaneSide, type SkillItem } from '@microcks/deep-ink';
  import { RouterLink } from '@/ui/app';
  import AgentScript from './AgentScript.svelte';
  import { END_ICON, FALLBACK_ID, initialSkillId, skillItems } from './skills';

  /** Skills of the card with their scripted conversations (the APIExamples artifact). */
  let { agent }: { agent: AgentProfile } = $props();
  let skillId = $state(untrack(() => initialSkillId(agent)));
  let convId = $state<string | undefined>();
  const fallbackSelected = $derived(skillId === FALLBACK_ID);
  const skill = $derived(fallbackSelected ? undefined : agent.skills.find((s) => s.id === skillId));
  const convs = $derived(fallbackSelected ? [agent.fallback] : agent.conversations.filter((c) => skill?.conversationIds.includes(c.id)));
  const conversation = $derived(convs.find((c) => c.id === convId) ?? convs[0]);
  const serviceLink = $derived(skill?.usesService ? `/services/${skill.usesService}` : undefined);

  const items: SkillItem[] = $derived(skillItems(agent));
  const pick = (id: string) => {
    skillId = id;
    convId = undefined;
  };
</script>

<SplitPane sideMax="340px" mainWidth="560px" keepSideMax
  ><SplitPaneSide class="agent-rail"
    ><SectionLabel as="p" size="sm" weight="regular" split lineHeight="snug" class="agent-rail-head"
      ><span>{agent.skills.length}<!----> skills</span><span>calls · 24 h</span></SectionLabel
    ><SkillList label={`Skills of ${agent.name} ${agent.version}`} skills={items} selectedId={skillId} onselectskill={pick} /><p
      class="agent-rail-note"
      >Each skill of the Agent Card is served as an operation. Its conversations come from the <span class="demo-mono">APIExamples</span
      > artifact, keyed by skill id.</p
    ></SplitPaneSide
  ><SplitPaneMain as="section" class="agent-detail" aria-label="Skill detail"
    ><div class="agent-skill-head"
      ><div class="agent-skill-title"
        ><span class="agent-kind" data-fallback={fallbackSelected ? '' : undefined}>{fallbackSelected ? 'fallback' : 'skill'}</span><h2
          >{fallbackSelected ? 'No skill matched' : skill?.name}</h2
        ><span class="agent-skill-id">{fallbackSelected ? agent.fallback.id : skill?.id}</span></div
      ><p class="agent-skill-desc"
        >{fallbackSelected
          ? 'Messages with no metadata.skillId and no conversation close enough to their first text or data part land here. The mock still answers with a well-formed task, in state rejected, with an agent message that explains its scope.'
          : skill?.description}</p
      ></div
    >{#if skill}<div class="agent-modes"
        ><div class="agent-mode"
          ><span class="agent-mode-label">inputModes</span><span class="agent-mode-chips"
            >{#each skill.inputModes as m (m)}<Chip>{m}</Chip>{/each}</span
          ></div
        ><span class="agent-mode-arrow"><Icon name="arrow-right-long" size={18} /></span><div class="agent-mode"
          ><span class="agent-mode-label">outputModes</span><span class="agent-mode-chips"
            >{#each skill.outputModes as m (m)}<Chip>{m}</Chip>{/each}</span
          ></div
        ><div class="agent-mode"
          ><span class="agent-mode-label">tags</span><span class="agent-mode-chips"
            >{#each skill.tags as m (m)}<Chip variant="outline">{m}</Chip>{/each}</span
          ></div
        ></div
      ><div class="agent-prompts-block"
        ><h3 class="agent-h3-sm">Sample prompts <span class="agent-h3-note">· skill.examples</span></h3><ul class="agent-prompts"
          >{#each skill.examples as p (p)}<li>“<!---->{p}<!---->”</li>{/each}</ul
        ></div
      >{/if}<div class="agent-convs"
      ><div class="agent-convs-head"
        ><h3>Conversations</h3><span class="agent-convs-count"
          >{fallbackSelected
            ? '1 fallback conversation, not keyed by a skill'
            : `${convs.length} ${convs.length === 1 ? 'conversation' : 'conversations'} in api-pastry-concierge-examples.yaml`}</span
        ></div
      ><ul class="agent-conv-list" aria-label="Conversations of the selected skill"
        >{#each convs as c (c.id)}{@const states = c.steps.filter((s) => s.kind === 'state')}{@const last = states.at(-1)}{@const end =
              last?.kind === 'state' ? last.state : undefined}<li
            ><button type="button" class="agent-conv" aria-pressed={c.id === conversation?.id} onclick={() => (convId = c.id)}
              ><span class="agent-conv-id">{c.id}</span><span class="agent-conv-meta"
                >{#if end}<span class="agent-conv-end" data-state={end}><Icon name={END_ICON[end] ?? 'circle'} size={13} />{end}</span>{/if}<span
                  >{#if c.turns > 1}{`${c.turns} turns · `}{/if}{states.length}<!----> states{#if c.streamed}{' · streamed'}{/if}</span
                ></span
              ></button
            ></li
          >{/each}</ul
      ></div
    >{#if conversation}{#key conversation.id}<AgentScript {conversation} {serviceLink} />{/key}{/if}<div class="agent-dispatcher"
      ><span class="agent-dispatcher-item"
        ><span class="ex-muted">Dispatcher</span><span class="agent-dispatcher-rule">A2A_SKILL · metadata.skillId, else first text part</span></span
      >{#if serviceLink}<span class="agent-dispatcher-sep" aria-hidden="true"></span><span class="agent-dispatcher-item"
          ><span class="ex-muted">uses</span><RouterLink class="agent-dispatcher-link" to={serviceLink}
            >API Pastry 2.0 · <span class="demo-mono">GET /pastries/<!---->{'{name}'}</span></RouterLink
          ></span
        >{/if}{#if fallbackSelected}<span class="ex-secondary"
          >No match answers a task in state <span class="demo-mono">rejected</span>, not an HTTP error.</span
        >{/if}</div
    ></SplitPaneMain
  ></SplitPane
>
