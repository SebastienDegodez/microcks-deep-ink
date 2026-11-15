import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { Snapshot, SnapshotImportPreviewItem } from '@/domain/govern';
import { useQuery, useReturnFocus, useUseCases } from '@/ui/app';
import { ApiBadge, type Protocol, Button, DropZone, Icon, SectionLabel, SplitPane, SplitPaneMain, SplitPaneSide } from '@microcks/deep-ink';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { plural, type Notify } from './notify';
import { DEFAULT_FILE, INITIAL, SAMPLE, importedMessage, toggledSelection } from './snapshots';
import '@microcks/demo-styles/pages/admin/snapshots.css';

export function SnapshotsTab({ notify }: { notify: Notify }) {
  return (
    <div className="ad-tab">
      <p className="ad-intro">A Snapshot holds Services &amp; APIs definitions: operations, examples, contracts and their resources. Test runs and usage metrics are not included.</p>
      <SplitPane mainWidth="520px" sideWidth="380px" sideMax="none">
        <ExportCard />
        <SplitPaneSide>
          <ImportCard notify={notify} />
        </SplitPaneSide>
      </SplitPane>
    </div>
  );
}

function ExportCard() {
  const uc = useUseCases();
  const services = useQuery(() => uc.govern.listSnapshotServices(), []);
  const [selected, setSelected] = useState<string[]>(INITIAL);
  const [exported, setExported] = useState<Snapshot | null>(null);

  if (services.status === 'error') return <ErrorBlock error={services.error} what="Services" onRetry={services.reload} />;
  const list = services.data ?? [];
  const choose = (ids: string[]) => {
    setSelected(ids);
    setExported(null);
  };
  const doExport = async () => {
    const snap = await uc.govern.exportSnapshot(selected);
    setExported(snap);
  };

  return (
    <SplitPaneMain as="section" className="ad-snap-card" aria-labelledby="ad-export-title">
      <div className="ad-snap-head">
        <h2 id="ad-export-title">Export</h2>
        <div className="ad-snap-select">
          <span className="ad-meta">{selected.length} of {list.length} selected</span>
          <button type="button" className="ad-link-button" onClick={() => choose(list.map((s) => s.id))}>Select all</button>
          <button type="button" className="ad-link-button" onClick={() => choose([])}>None</button>
        </div>
      </div>
      {services.data ? (
        <fieldset className="ad-snap-grid">
          <legend className="sr-only">Services to export</legend>
          {list.map((s) => {
            const on = selected.includes(s.id);
            return (
              <label key={s.id} className="ad-snap-service" data-selected={on ? '' : undefined}>
                <input type="checkbox" checked={on} onChange={(e) => choose(toggledSelection(selected, s.id, e.target.checked))} />
                <ApiBadge protocol={s.protocol as Protocol} name={`${s.name} ${s.version}`} size="sm" className="ad-snap-badge" />
                <span className="ad-snap-ops">{plural(s.operationCount, 'op')}</span>
              </label>
            );
          })}
        </fieldset>
      ) : (
        <LoadingBlock label="services" lines={3} />
      )}
      <div className="ad-snap-actions">
        <Button variant="primary" icon="download" disabled={selected.length === 0} onClick={doExport}>Export snapshot</Button>
        <span role="status" className="ad-snap-status">
          {exported ? (
            <>
              <Icon name="check" size={14} className="ad-ok" />
              <span className="ad-snap-file">{exported.fileName}</span>
              <span>downloaded · {plural(exported.serviceIds.length, 'service')}, {plural(exported.operations ?? 0, 'operation')} · {exported.sizeKb} KB</span>
            </>
          ) : null}
        </span>
      </div>
    </SplitPaneMain>
  );
}

function ImportCard({ notify }: { notify: Notify }) {
  const uc = useUseCases();
  const inputId = useId();
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<SnapshotImportPreviewItem[] | null>(null);
  const [result, setResult] = useState<{ created: number; replaced: number } | null>(null);
  // Each step removes the control that had focus: move it to the control that replaces it.
  const sectionRef = useRef<HTMLElement>(null);
  const { focusLater } = useReturnFocus();

  const pick = async (name: string) => {
    setFileName(name);
    setResult(null);
    focusLater(() => document.getElementById(`${inputId}-change`));
    setPreview(name ? await uc.govern.previewSnapshotImport(name) : null);
  };
  const clear = () => {
    // The drop zone's file input has an id of its own: find it by class.
    focusLater(() => sectionRef.current?.querySelector<HTMLElement>('.drop-zone-input'));
    setFileName('');
    setPreview(null);
    setResult(null);
  };
  const doImport = async () => {
    const r = await uc.govern.importSnapshot(fileName);
    setResult(r);
    focusLater(() => document.getElementById(`${inputId}-open`));
    notify(importedMessage(fileName, r));
  };

  return (
    <section ref={sectionRef} className="ad-snap-card" aria-labelledby="ad-import-title">
      <h2 id="ad-import-title">Import</h2>
      {!fileName ? (
        <DropZone
          size="sm"
          heading="Drop a snapshot here"
          hint={<>A <code className="demo-mono">microcks-repository.json</code> exported from any Microcks instance</>}
          accept="application/json,.json"
          multiple={false}
          chooseLabel="Choose a file"
          onFiles={(files) => void pick(files[0]?.name ?? DEFAULT_FILE)}
        >
          <button type="button" className="ad-link-button ad-drop-sample" onClick={() => pick(SAMPLE)}>Use a sample snapshot</button>
        </DropZone>
      ) : (
        <div className="ad-snap-preview">
          <div className="ad-snap-filerow">
            <Icon name="file-plain" size={15} className="ad-snap-file-icon" />
            <span className="ad-snap-filename">{fileName}</span>
            {result ? null : <button type="button" id={`${inputId}-change`} className="ad-link-button" aria-label={`Change file ${fileName}`} onClick={clear}>Change</button>}
          </div>
          {preview ? (
            <>
              <SectionLabel as="h3" size="sm" lineHeight="normal">Preview · {plural(preview.length, 'service')} detected</SectionLabel>
              <ul className="ad-snap-items">
                {preview.map((p) => (
                  <li key={p.name}>
                    <ApiBadge protocol={p.protocol as Protocol} name={p.name} size="sm" />
                    <span className="ad-snap-effect" data-kind={p.kind}>{p.effect}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <LoadingBlock label="snapshot preview" lines={3} />
          )}
          {result ? (
            <div role="status" className="ad-snap-done">
              <Icon name="check" size={14} className="ad-ok" />
              <span className="ad-snap-done-text">Imported · {result.created} created, {result.replaced} replaced</span>
              <Link to="/services" id={`${inputId}-open`} className="ad-snap-done-link">Open APIs &amp; Services</Link>
              <button type="button" className="ad-link-button" onClick={clear}>Import another</button>
            </div>
          ) : (
            <div className="ad-snap-actions">
              <Button variant="primary" icon="upload" disabled={!preview} onClick={doImport}>Import snapshot</Button>
              <span className="ad-note">Services with the same name and version are replaced.</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
