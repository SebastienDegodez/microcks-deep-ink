import type { CreateTestForm } from '@/application/testing';
import type { TestTarget } from '@/domain/testing';
import { Radio } from '@microcks/deep-ink';
import type { Draft, UpdateDraft } from './draft';
import { FormSection } from './FormSection';

export function RunnerSection({ form, target, d, update }: { form: CreateTestForm; target: TestTarget; d: Draft; update: UpdateDraft }) {
  return (
    <FormSection step="02" title="Test runner" hint='What "conformant" means for this run' gap="12">
      <div role="radiogroup" aria-label="Test runner" className="tc-runner-grid">
        {target.runners.map((r) => {
          const meta = form.runners.find((m) => m.id === r.id);
          return (
            <Radio
              key={r.id}
              variant="card"
              name="runner"
              value={r.id}
              checked={d.runner === r.id}
              disabled={Boolean(r.unavailableReason)}
              onChange={() => update({ runner: r.id })}
              label={
                <span className="tc-runner-name">
                  <span className="tc-runner-id">{r.id}</span>
                  {r.recommended ? <span className="tc-bestfit">best fit</span> : null}
                </span>
              }
              description={
                <>
                  <span className="tc-runner-desc">{meta?.description}</span>
                  {r.unavailableReason ? <span className="tc-reason">{r.unavailableReason}</span> : null}
                </>
              }
            />
          );
        })}
      </div>
    </FormSection>
  );
}
