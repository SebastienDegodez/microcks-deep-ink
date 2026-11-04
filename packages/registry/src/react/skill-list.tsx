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
        const calls =
          s.calls !== undefined ? (
            <span className="skill-item-calls">
              {s.calls}
              <span className="sr-only"> calls in 24 hours</span>
            </span>
          ) : null;
        const result = s.result ? (
          <span className="skill-item-result" data-result={s.result}>
            <Icon name={s.result === 'pass' ? 'check' : 'cross'} size={12} />
            {s.result === 'pass' ? 'passed' : 'failed'}
            {s.resultNote ? <span className="sr-only">: {s.resultNote}</span> : null}
          </span>
        ) : null;
        // The catch-all entry has no skill id: its name leads, its tags read as one muted line.
        const inner = s.fallback ? (
          <>
            <span className="skill-item-head">
              <span className="skill-item-title">{s.name}</span>
              {calls}
            </span>
            {s.tags?.length || s.meta ? <span className="skill-item-line">{[...(s.tags ?? []), ...(s.meta ? [s.meta] : [])].join(' · ')}</span> : null}
            {result ? <span className="skill-item-foot">{result}</span> : null}
          </>
        ) : (
          <>
            <span className="skill-item-head">
              <span className="skill-item-id">{s.id}</span>
              {calls}
            </span>
            {s.name ? <span className="skill-item-name">{s.name}</span> : null}
            {s.tags?.length || s.meta || result ? (
              <span className="skill-item-foot">
                {s.tags?.map((t) => (
                  <span key={t} className="skill-item-tag">
                    {t}
                  </span>
                ))}
                {s.meta ? <span className="skill-item-meta">{s.meta}</span> : null}
                {result}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={s.id} className="skill-item-row" data-fallback={s.fallback ? '' : undefined}>
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
