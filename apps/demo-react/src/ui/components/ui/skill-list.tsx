// Deep Ink · skill-list@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';
import { Icon } from './icon';

export interface SkillItem {
  /** Skill id from the Agent Card: `order-pastry`. */
  id: string;
  name: string;
  /** Calls in the last 24 h. */
  calls?: number;
  tags?: string[];
  /** "2 conversations" */
  meta?: string;
  /** Result of the last test of this skill. */
  result?: 'pass' | 'fail';
  /** One sentence for the result, read after the word: "HTTP+JSON resumed input-required on a new taskId". */
  resultNote?: string;
  /** The catch-all entry (no skill matched): dashed outline. */
  fallback?: boolean;
}

export interface SkillListProps extends Omit<HTMLAttributes<HTMLUListElement>, 'onSelect'> {
  /** Accessible name of the list: "Skills of Pastry concierge 1.0". */
  label: string;
  skills: SkillItem[];
  selectedId?: string;
  /** Makes the items toggle buttons (`aria-pressed`). Without it the list is read-only. */
  onSelectSkill?: (id: string) => void;
}

/**
 * Skills of an Agent Card, as served by the mock. Each item gives the id, the name, the call count, the tags and
 * the last test result. A selectable list uses `aria-pressed`, not tabs: the detail sits in its own region.
 */
export function SkillList({ label, skills, selectedId, onSelectSkill, className, ...rest }: SkillListProps) {
  return (
    <ul {...rest} aria-label={label} className={['skill-list', className].filter(Boolean).join(' ')}>
      {skills.map((s) => {
        const inner = (
          <>
            <span className="skill-item-head">
              <span className="skill-item-id">{s.id}</span>
              {s.calls !== undefined ? (
                <span className="skill-item-calls">
                  {s.calls}
                  <span className="sr-only"> calls in 24 hours</span>
                </span>
              ) : null}
            </span>
            {s.name ? <span className="skill-item-name">{s.name}</span> : null}
            {s.tags?.length ? (
              <span className="skill-item-tags">
                {s.tags.map((t) => (
                  <span key={t} className="skill-item-tag">
                    {t}
                  </span>
                ))}
              </span>
            ) : null}
            {s.meta || s.result ? (
              <span className="skill-item-foot">
                {s.meta ? <span>{s.meta}</span> : null}
                {s.result ? (
                  <span className="skill-item-result" data-result={s.result}>
                    <Icon name={s.result === 'pass' ? 'check' : 'cross'} size={12} />
                    {s.result === 'pass' ? 'passed' : 'failed'}
                    {s.resultNote ? <span className="sr-only">: {s.resultNote}</span> : null}
                  </span>
                ) : null}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={s.id} className="skill-item-row">
            {onSelectSkill ? (
              <button type="button" className="skill-item" data-variant={s.fallback ? 'fallback' : undefined} aria-pressed={selectedId === s.id} onClick={() => onSelectSkill(s.id)}>
                {inner}
              </button>
            ) : (
              <div className="skill-item" data-variant={s.fallback ? 'fallback' : undefined}>
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
