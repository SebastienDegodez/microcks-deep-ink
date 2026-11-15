import type { Ref } from 'react';
import { timeoutHelp, type TestFormErrors, type TestTarget } from '@/domain/testing';
import { Button, Checkbox, Radio, Field, Icon, Input, MethodTag } from '@microcks/deep-ink';
import type { Draft, UpdateDraft } from './draft';
import { FormSection } from './FormSection';
import { allOperationsSelected, checkOperation, operationsLabel, toggleAllOperations } from './form';

interface ScopeSectionProps {
  target: TestTarget;
  protocol: Parameters<typeof MethodTag>[0]['protocol'];
  d: Draft;
  update: UpdateDraft;
  uid: string;
  selected: string[];
  errors: Pick<TestFormErrors, 'operations' | 'timeout'>;
  opsRef: Ref<HTMLInputElement>;
  timeoutRef: Ref<HTMLInputElement>;
}

export function ScopeSection({ target, protocol, d, update, uid, selected, errors, opsRef, timeoutRef }: ScopeSectionProps) {
  const isEvent = target.type === 'EVENT';
  const allSelected = allOperationsSelected(target, selected);
  const opsError = errors.operations;
  const opsErrorId = `${uid}-ops-error`;
  return (
    <FormSection step="03" title="Scope">
      <div className="tc-scope">
        <div className="tc-ops" role={isEvent ? 'radiogroup' : 'group'} aria-labelledby={`${uid}-ops-label`} aria-describedby={opsError ? opsErrorId : undefined}>
          <div className="tc-ops-head">
            <span id={`${uid}-ops-label`} className="tc-ops-label">
              {operationsLabel(target, selected)}
            </span>
            {!isEvent ? (
              <Button variant="link" size="sm" className="tc-ops-toggle" onClick={() => update(toggleAllOperations(target, selected))}>
                {allSelected ? 'Clear all' : 'Select all'}
              </Button>
            ) : null}
          </div>
          {target.operations.map((o, i) => {
            const on = selected.includes(o.id);
            const label = <OperationLabel verb={o.verb} path={o.path} samples={o.samples} protocol={protocol} />;
            return isEvent ? (
              <Radio key={o.id} ref={i === 0 ? opsRef : undefined} variant="card" className="tc-op" name="operation" checked={on} onChange={() => update({ ops: [o.id] })} label={label} />
            ) : (
              <Checkbox
                key={o.id}
                ref={i === 0 ? opsRef : undefined}
                variant="card"
                className="tc-op"
                checked={on}
                onChange={(e) => update(checkOperation(selected, o.id, e.target.checked))}
                label={label}
              />
            );
          })}
          {opsError ? (
            <p className="error" id={opsErrorId}>
              <Icon name="cross" size={13} />
              <span>
                <span className="sr-only">Error: </span>
                {opsError}
              </span>
            </p>
          ) : null}
        </div>
        <Field label="Timeout" help={timeoutHelp(d.timeout, isEvent)} error={errors.timeout} className="tc-timeout-field">
          {(control) => (
            <div className="tc-timeout">
              <Input
                {...control}
                ref={timeoutRef}
                type="number"
                mono
                min={1000}
                max={30000}
                step={1000}
                value={d.timeout}
                onChange={(e) => update({ timeout: e.target.value })}
              />
              <span className="tc-unit" aria-hidden="true">
                ms
              </span>
            </div>
          )}
        </Field>
      </div>
    </FormSection>
  );
}

function OperationLabel({ verb, path, samples, protocol }: { verb: string; path: string; samples: number; protocol?: Parameters<typeof MethodTag>[0]['protocol'] }) {
  return (
    <span className="tc-op-label">
      <MethodTag method={verb} protocol={protocol} className="tc-op-method" />
      <span className="tc-op-path">{path}</span>
      <span className="tc-op-samples">
        {samples} {samples === 1 ? 'sample' : 'samples'}
      </span>
    </span>
  );
}
