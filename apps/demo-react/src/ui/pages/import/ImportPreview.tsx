import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import type { ArazzoPreview, AgentPreview, ImportPreview } from '@/domain/importing';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Field } from '@/ui/components/ui/field';
import { Icon, type IconName } from '@/ui/components/ui/icon';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Segmented } from '@/ui/components/ui/segmented';
import { Select } from '@/ui/components/ui/select';
import { pluralize } from '../explore-kit/format';

interface ImportPreviewProps {
  preview: ImportPreview;
  role: 'primary' | 'secondary';
  onRoleChange: (role: 'primary' | 'secondary') => void;
  secret: string;
  onSecretChange: (name: string) => void;
  secretNames: { id: string; name: string }[];
  importing: boolean;
  onImport: () => void;
  onCancel: () => void;
}

/** Step 2: what Microcks understood of the artifact. Nothing is created yet. */
export function ImportPreviewCard({ preview, role, onRoleChange, secret, onSecretChange, secretNames, importing, onImport, onCancel }: ImportPreviewProps) {
  const { arazzo, agent, source } = preview;
  const importLabel = arazzo ? `Import ${arazzo.workflows.length} workflows` : agent || source.kind === 'git' || source.kind === 'url' ? 'Create source' : 'Import';
  return (
    <div className="step-card">
      <div className="step-head">
        <span className="step-head-badge"><Icon name="eye" size={18} /></span>
        <div className="step-head-text">
          <h2>Preview before creating the source</h2>
          <p>Nothing has been created yet. Here is what Microcks detected in the artifact.</p>
        </div>
      </div>

      {arazzo ? <ArazzoBody preview={preview} arazzo={arazzo} /> : agent ? <AgentBody preview={preview} agent={agent} /> : (
        <>
          {preview.services.map((s) => (
            <div key={`${s.name}${s.version}`} className="step-section" style={{ gap: 20 }}>
              <ArtifactCard
                icon="document"
                name={preview.artifactName ?? ''}
                origin={preview.origin}
                format={preview.formatLabel}
                badge={<ApiBadge protocol={s.protocol} name={s.name} version={s.version} />}
              />
              <div className="step-section">
                <h3>{pluralize(s.operations.length, 'Operation')} discovered · {preview.exampleCount ?? 0} Examples</h3>
                <ul className="boxed-list">
                  {s.operations.map((o) => (
                    <li key={`${o.method}${o.path}`}>
                      <MethodTag method={o.method} protocol={s.protocol} />
                      <span className="boxed-list-path">{o.path}</span>
                      <span className="boxed-list-meta">{o.dispatcher}</span>
                      <span className="boxed-list-end" data-wide="">{pluralize(o.exampleCount ?? 0, 'Example')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <div className="step-section">
            <h3 id="role-title">Artifact role</h3>
            <Segmented className="role-toggle" label="Artifact role" variant="joined" value={role} onChange={(id) => onRoleChange(id as 'primary' | 'secondary')} options={[{ id: 'primary', label: 'Primary' }, { id: 'secondary', label: 'Secondary' }]} />
            <p style={{ maxWidth: 720 }}>
              {role === 'secondary'
                ? 'Secondary: merges only non-conflicting Examples into an existing API, matched by name + version (here API Pastry 2.0). Ignored if no API matches.'
                : 'Primary: brings the Service structure, its Operations and its Examples. This is the default; then add secondary Artifacts (Postman, HAR, APIExamples) to enrich the Examples.'}
            </p>
          </div>
          {source.kind === 'url' ? (
            <div style={{ maxWidth: 360 }}>
              <Field label={<>Authentication Secret <span className="field-hint">optional, for a protected URL</span></>}>
                {(c) => (
                  <Select {...c} value={secret} onChange={(e) => onSecretChange(e.target.value)}>
                    <option value="">None</option>
                    {secretNames.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </Select>
                )}
              </Field>
            </div>
          ) : null}
          {source.kind === 'git' ? (
            <div className="note-box">
              <Icon name="clock" size={16} />
              <span>The source “{source.name}” will be created, scanned and imported immediately, then re-scanned every hour. <RouterLink to="/sources">Manage sources</RouterLink></span>
            </div>
          ) : null}
        </>
      )}

      <div className="step-actions">
        <Button variant="primary" icon="download" loading={importing} onClick={onImport}>{importLabel}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ArtifactCard({ icon, name, origin, status, format, badge, extra }: { icon: IconName; name: string; origin?: string; status?: string; format?: string; badge: ReactNode; extra?: ReactNode }) {
  return (
    <div className="artifact-card">
      <span className="artifact-card-icon"><Icon name={icon} size={20} /></span>
      <div className="artifact-card-text">
        <span className="artifact-card-name">{name}</span>
        {origin ? <span className="artifact-card-origin">{origin}</span> : null}
        {status ? <span role="status" className="artifact-card-status">{status}</span> : null}
      </div>
      <div className="artifact-card-badges">
        {format ? <span className="format-pill"><Icon name="check" size={12} />{format}</span> : null}
        {badge}
        {extra}
      </div>
    </div>
  );
}

function ArazzoBody({ preview, arazzo }: { preview: ImportPreview; arazzo: ArazzoPreview }) {
  const steps = arazzo.workflows.reduce((n, w) => n + w.steps, 0);
  return (
    <>
      <ArtifactCard
        icon="grid"
        name={arazzo.fileName}
        origin={preview.origin}
        status={`Valid Arazzo ${arazzo.arazzoVersion} · title “${arazzo.title}” ${arazzo.version} · ${arazzo.workflows.length} workflows · ${arazzo.sources.length} source descriptions`}
        format={`Arazzo ${arazzo.arazzoVersion}`}
        badge={<ApiBadge arazzo name={`${arazzo.title} ${arazzo.version}`} />}
      />
      <div className="step-section">
        <h3>{arazzo.workflows.length} workflows discovered · {steps} steps</h3>
        <ul className="boxed-list">
          {arazzo.workflows.map((w) => (
            <li key={w.workflowId}>
              <span className="boxed-list-main">
                <span className="boxed-list-title">{w.name}</span>
                <span className="boxed-list-sub">workflowId: {w.workflowId}</span>
              </span>
              {w.note ? <span className="note-pill" data-tone={w.blocked ? 'warning' : undefined}>{w.blocked ? <Icon name="warning" size={12} /> : null}{w.note}</span> : null}
              <span className="boxed-list-end">{w.steps} steps</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="step-section">
        <h3>Link source descriptions to Microcks APIs · {arazzo.sources.length} of {arazzo.sources.length} linked</h3>
        <p>Each step calls an operation of a source description. Link each one to an API already imported in Microcks: its operations are checked now, and its mocks become a run target.</p>
        <div className="sources-table">
          <table>
            <caption className="sr-only">Source descriptions</caption>
            <thead>
              <tr>
                <th scope="col">Source description</th>
                <th scope="col">Declared URL</th>
                <th scope="col">Microcks API</th>
                <th scope="col">Step operations</th>
              </tr>
            </thead>
            <tbody>
              {arazzo.sources.map((d) => (
                <tr key={d.name}>
                  <td><code>{d.name}</code> <span className="mono-sm">{d.type}</span></td>
                  <td className="mono-url">{d.url}</td>
                  <td>
                    <span className="linked">
                      <ApiBadge protocol={d.protocol} name={d.service} size="sm" />
                      <span className="linked-word"><Icon name="check" size={12} />Linked</span>
                      <span className="mono-sm">MATCHED</span>
                    </span>
                  </td>
                  <td><span className="ops-found"><Icon name="check-circle" size={14} />{d.operationsFound}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="overlay-line">
          <Icon name="layers" size={15} />
          <span>Linked through the {arazzo.overlay} overlay <code>{arazzo.fileName.replace(/\.arazzo\.ya?ml$/, '.arazzo-sources.yaml')}</code>, or link them here.</span>
        </p>
        <div role="note" className="note-box" data-tone="info" style={{ maxWidth: 760 }}>
          <Icon name="info" size={16} />
          <span>Arazzo documents outside the supported subset are refused (e.g. goto actions, jsonpath criteria, workflowId steps). Success criteria use the simple and regex types; step actions are end and retry.</span>
        </div>
      </div>
    </>
  );
}

function AgentBody({ preview, agent }: { preview: ImportPreview; agent: AgentPreview }) {
  return (
    <>
      <ArtifactCard
        icon="id-card"
        name={agent.fileName}
        origin={preview.origin}
        status={`Valid A2A Agent Card · provider ${agent.provider} · ${agent.skills.length} skills · ${agent.interfaces.length} interfaces · security ${agent.security}`}
        format={preview.formatLabel}
        badge={<ApiBadge protocol="A2A" name="Pastry concierge" version="1.0" />}
        extra={<span className="projection-pill">Projection · v2 module</span>}
      />
      <div className="step-section">
        <h3>{agent.skills.length} skills discovered · each one becomes an operation</h3>
        <ul className="boxed-list">
          {agent.skills.map((k) => (
            <li key={k.id}>
              <span className="boxed-list-main" style={{ flexBasis: 200 }}>
                <span className="boxed-list-title">{k.name}</span>
                <span className="boxed-list-sub">skill id: {k.id}{k.modes ? ` · ${k.modes}` : ''}</span>
              </span>
              <span className="boxed-list-op"><Icon name="arrow-right" size={13} />operation {k.id}</span>
              {k.note ? <span className="note-pill">{k.note}</span> : null}
            </li>
          ))}
        </ul>
      </div>
      <div className="agent-split">
        <div className="step-section">
          <h3>{agent.interfaces.length} interfaces · supportedInterfaces, in order</h3>
          <ol className="boxed-list" data-dense="">
            {agent.interfaces.map((i, n) => (
              <li key={i.binding}>
                <span className="boxed-list-binding">{i.binding}</span>
                <span className="boxed-list-url">{i.url}</span>
                {i.preferred ? <span className="preferred-pill">preferred</span> : null}
                <span className="sr-only">{`Mock: ${agent.mockInterfaces[n]?.url ?? ''}`}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="step-section">
          <h3>Capabilities</h3>
          <ul className="capabilities">
            {agent.capabilities.map((c) => (
              <li key={c.name} data-on={String(c.on)}>
                <Icon name={c.on ? 'check' : 'close-sm'} size={13} />
                {c.name}
                <span className="sr-only">{c.on ? ' (supported)' : ' (not supported)'}</span>
              </li>
            ))}
            <li>Modes {agent.modes.join(', ')}</li>
          </ul>
        </div>
      </div>
      <div role="note" className="note-box" data-tone="warning">
        <Icon name="alert-circle" size={16} />
        <span>Add an APIExamples secondary artifact to give the mock its conversations. The card alone describes skills, not what the agent answers. The mock serves the card with supportedInterfaces rewritten to point at Microcks, on all {agent.mockInterfaces.length} transports.</span>
      </div>
    </>
  );
}
