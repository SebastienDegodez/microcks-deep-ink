import type { Ref } from 'react';
import type { CreateTestForm } from '@/application/testing';
import type { TestTarget } from '@/domain/testing';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Chip } from '@/ui/components/ui/chip';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import type { Draft, UpdateDraft } from './draft';
import { FormSection } from './FormSection';

interface TargetSectionProps {
  form: CreateTestForm;
  target: TestTarget;
  service: CreateTestForm['services'][number] | undefined;
  d: Draft;
  update: UpdateDraft;
  uid: string;
  endpointError: string | undefined;
  endpointRef: Ref<HTMLInputElement>;
  onPickService: (id: string) => void;
}

export function TargetSection({ form, target, service, d, update, uid, endpointError, endpointRef, onPickService }: TargetSectionProps) {
  const samples = target.operations.reduce((n, o) => n + o.samples, 0);
  return (
    <FormSection step="01" title="Target">
      <Field label="Service under test">
        {(control) => (
          <div className="tc-service-row">
            <span className="tc-svc-picker">
              {service ? <ApiBadge protocol={service.protocol} name={service.name} version={service.version} /> : null}
              <span className="tc-svc-meta">
                {target.operations.length} {target.operations.length === 1 ? 'operation' : 'operations'} · {samples} {samples === 1 ? 'sample' : 'samples'}
              </span>
              <Icon name="chevron-down" size={14} />
              {/* The native select carries the keyboard and screen reader behaviour; the styled box above is its face. */}
              <select {...control} aria-describedby={`${uid}-contract`} className="tc-svc-select" value={target.serviceId} onChange={(e) => onPickService(e.target.value)}>
                {form.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.version} · {form.targets.find((t) => t.serviceId === s.id)?.operations.length ?? 0} ops
                  </option>
                ))}
              </select>
            </span>
            <span className="tc-contract" id={`${uid}-contract`}>
              Contract: <span className="tc-contract-value">{target.artifacts}</span>
            </span>
          </div>
        )}
      </Field>
      <div className="tc-endpoint-block">
        <Field label="Test endpoint" required help={target.endpointHelp} error={endpointError} className="tc-endpoint">
          {(control) => (
            <Input
              {...control}
              ref={endpointRef}
              mono
              spellCheck={false}
              autoComplete="off"
              value={d.endpoint}
              onChange={(e) => update({ endpoint: e.target.value })}
            />
          )}
        </Field>
        {target.recentEndpoints.length > 0 ? (
          <div className="tc-recent" role="group" aria-label="Recently tested endpoints">
            <span className="tc-recent-label">Recently tested</span>
            {target.recentEndpoints.map((r) => (
              <Chip key={r.url} size="sm" pressed={r.url === d.endpoint.trim()} onClick={() => update({ endpoint: r.url })} className="tc-recent-chip">
                <span className="tc-recent-env">{r.env}</span> {r.url}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>
    </FormSection>
  );
}
