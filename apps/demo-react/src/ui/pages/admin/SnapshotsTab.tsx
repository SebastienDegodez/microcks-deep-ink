import { useState } from 'react';
import type { SnapshotImportPreviewItem } from '@/domain/govern';
import { useQuery, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Field } from '@/ui/components/ui/field';
import { Input } from '@/ui/components/ui/input';
import { Panel } from '@/ui/components/ui/panel';
import type { Notify } from './notify';

export function SnapshotsTab({ notify }: { notify: Notify }) {
  const uc = useUseCases();
  const services = useQuery(() => uc.catalog.listServices(), []);
  const [selected, setSelected] = useState<string[]>([]);
  const [exported, setExported] = useState<{ fileName: string; json: string; operations?: number } | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<SnapshotImportPreviewItem[] | null>(null);

  const doExport = async () => {
    const snap = await uc.govern.exportSnapshot(selected);
    setExported(snap);
    notify(`Snapshot ${snap.fileName} ready.`);
  };
  const pick = async (name: string) => {
    setFileName(name);
    setPreview(name ? await uc.govern.previewSnapshotImport(name) : null);
  };
  const doImport = async () => {
    const r = await uc.govern.importSnapshot(fileName);
    notify(`Imported ${fileName}: ${r.created} created, ${r.replaced} replaced.`);
    setPreview(null);
    setFileName('');
  };

  return (
    <div className="stack">
      <Panel title="Export">
        <div className="stack">
          <fieldset className="ad-members">
            <legend>Services to export</legend>
            {(services.data ?? []).map((s) => (
              <Checkbox
                key={s.id}
                label={`${s.name} ${s.version}`}
                checked={selected.includes(s.id)}
                onChange={(e) => setSelected(e.target.checked ? [...selected, s.id] : selected.filter((x) => x !== s.id))}
              />
            ))}
          </fieldset>
          <div className="demo-actions-row">
            <Button variant="primary" icon="upload" disabled={selected.length === 0} onClick={doExport}>Export snapshot</Button>
            <span className="demo-muted" role="status">{selected.length} {selected.length === 1 ? 'service' : 'services'} selected</span>
          </div>
          {exported ? (
            <div className="stack">
              <p>
                <strong className="demo-mono">{exported.fileName}</strong>
                {exported.operations ? ` · ${exported.operations} operations` : ''}
              </p>
              <CopyButton value={exported.json} label="Copy JSON" />
            </div>
          ) : null}
        </div>
      </Panel>
      <Panel title="Import">
        <div className="stack">
          <Field label="Snapshot file" help="Choose a JSON snapshot exported from another instance.">
            {(c) => <Input {...c} className="ad-file" type="file" accept=".json,application/json" onChange={(e) => pick(e.target.files?.[0]?.name ?? '')} />}
          </Field>
          <div>
            <Button onClick={() => pick('pastry-snapshot.json')}>Use the sample snapshot</Button>
          </div>
          {preview ? (
            <div className="stack">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{fileName}: what will happen</h3>
              <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
                {preview.map((p) => (
                  <li key={p.name}>
                    <strong>{p.kind === 'new' ? 'New' : 'Replace'}</strong> · {p.name} ({p.protocol}) · {p.effect}
                  </li>
                ))}
              </ul>
              <div><Button variant="primary" onClick={doImport}>Import snapshot</Button></div>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
