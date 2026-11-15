import type { TestTarget } from '@/domain/testing';
import { Button, Input, Select } from '@microcks/deep-ink';
import type { Draft, HeaderRow, UpdateDraft } from './draft';
import { FormSection } from './FormSection';
import { addApiKeyHeader, addHeader, patchHeader, removeHeader } from './form';

export function HeadersSection({ target, d, update }: { target: TestTarget; d: Draft; update: UpdateDraft }) {
  const setHeader = (id: number, patch: Partial<HeaderRow>) => update(patchHeader(d, id, patch));
  return (
    <FormSection step="05" title="Request headers" hint="Optional · added to or overriding the examples' headers" gap="12">
      {d.headers.length === 0 ? <p className="tc-empty">No extra header. Use a comma-separated list for several values of the same header.</p> : null}
      {d.headers.length > 0 ? (
        <div className="tc-headers">
          <div className="tc-header-row tc-header-head" aria-hidden="true">
            <span>Applies to</span>
            <span>Name</span>
            <span>Values</span>
            <span />
          </div>
          {d.headers.map((h, i) => (
            <div className="tc-header-row" key={h.id}>
              <Select aria-label={`Header ${i + 1} applies to`} className="tc-mono-select" value={h.scope} onChange={(e) => setHeader(h.id, { scope: e.target.value })}>
                <option value="globals">All operations</option>
                {target.operations.map((o) => (
                  <option key={o.id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </Select>
              <Input aria-label={`Header ${i + 1} name`} mono spellCheck={false} placeholder="x-api-key" value={h.name} onChange={(e) => setHeader(h.id, { name: e.target.value })} />
              <Input aria-label={`Header ${i + 1} values`} mono spellCheck={false} placeholder="value1, value2" value={h.values} onChange={(e) => setHeader(h.id, { values: e.target.value })} />
              <Button iconOnly icon="cross" size="sm" aria-label={`Remove header ${h.name || i + 1}`} onClick={() => update(removeHeader(d, h.id))} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="tc-header-actions">
        <Button variant="dashed" size="compact" icon="plus" onClick={() => update(addHeader(d))}>
          Add header
        </Button>
        {d.headers.length === 0 ? (
          <Button
            variant="outline"
            size="compact"
            className="tc-apikey"
            onClick={() => update(addApiKeyHeader(d))}
          >
            + x-api-key (globals)
          </Button>
        ) : null}
      </div>
    </FormSection>
  );
}
