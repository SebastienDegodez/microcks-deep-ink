import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import type { Snapshot, SnapshotImportPreviewItem } from '@/domain/govern';
import { useQuery, useUseCases } from '@/ui/app';
import { ApiBadge, type Protocol } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import { plural, type Notify } from './notify';
import './snapshots.css';

const SAMPLE = 'microcks-repository-staging.json';
/** Preselected on the prototype. */
const INITIAL = ['pastry2', 'orders'];

export function SnapshotsTab({ notify }: { notify: Notify }) {
  return (
    <div className="ad-tab">
      <p className="ad-intro">A Snapshot holds Services &amp; APIs definitions: operations, examples, contracts and their resources. Test runs and usage metrics are not included.</p>
      <div className="ad-snapshots">
        <ExportCard />
        <ImportCard notify={notify} />
      </div>
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
    <section className="ad-snap-card ad-snap-export" aria-labelledby="ad-export-title">
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
                <input type="checkbox" checked={on} onChange={(e) => choose(e.target.checked ? [...selected, s.id] : selected.filter((x) => x !== s.id))} />
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
    </section>
  );
}

function ImportCard({ notify }: { notify: Notify }) {
  const uc = useUseCases();
  const inputId = useId();
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<SnapshotImportPreviewItem[] | null>(null);
  const [result, setResult] = useState<{ created: number; replaced: number } | null>(null);
  // Each step removes the control that had focus: move it to the control that replaces it.
  const focusRef = useRef('');
  useEffect(() => {
    if (!focusRef.current) return;
    const el = document.getElementById(focusRef.current);
    if (el) {
      el.focus();
      focusRef.current = '';
    }
  });

  const pick = async (name: string) => {
    focusRef.current = `${inputId}-change`;
    setFileName(name);
    setResult(null);
    setDragging(false);
    setPreview(name ? await uc.govern.previewSnapshotImport(name) : null);
  };
  const clear = () => {
    focusRef.current = inputId;
    setFileName('');
    setPreview(null);
    setResult(null);
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) void pick(f.name);
  };
  // Drag and drop is an enhancement attached as DOM listeners (as in the registry drop-zone): the zone
  // itself is not a control; the file input and the sample button do everything with the keyboard.
  const zoneRef = useRef<HTMLDivElement>(null);
  const pickRef = useRef(pick);
  useEffect(() => {
    pickRef.current = pick;
  });
  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    const over = (e: Event) => {
      e.preventDefault();
      setDragging(true);
    };
    const leave = () => setDragging(false);
    const drop = (e: Event) => {
      e.preventDefault();
      void pickRef.current((e as globalThis.DragEvent).dataTransfer?.files[0]?.name ?? 'microcks-repository.json');
    };
    zone.addEventListener('dragover', over);
    zone.addEventListener('dragleave', leave);
    zone.addEventListener('drop', drop);
    return () => {
      zone.removeEventListener('dragover', over);
      zone.removeEventListener('dragleave', leave);
      zone.removeEventListener('drop', drop);
    };
  }, [fileName]);
  const doImport = async () => {
    const r = await uc.govern.importSnapshot(fileName);
    focusRef.current = `${inputId}-open`;
    setResult(r);
    notify(`Snapshot ${fileName} imported: ${plural(r.created, 'Service')} created, ${r.replaced} replaced.`);
  };

  return (
    <section className="ad-snap-card ad-snap-import" aria-labelledby="ad-import-title">
      <h2 id="ad-import-title">Import</h2>
      {!fileName ? (
        <div
          ref={zoneRef}
          role="group"
          aria-labelledby={`${inputId}-heading`}
          className="ad-drop"
          data-dragging={dragging ? '' : undefined}
        >
          <Icon name="upload" size={28} className="ad-drop-icon" />
          <span className="ad-drop-heading" id={`${inputId}-heading`}>Drop a snapshot here</span>
          <span className="ad-drop-hint" id={`${inputId}-hint`}>A <span className="ad-mono">microcks-repository.json</span> exported from any Microcks instance</span>
          <div className="ad-drop-actions">
            <input id={inputId} type="file" className="ad-drop-input sr-only" accept="application/json,.json" aria-describedby={`${inputId}-hint`} onChange={onFile} />
            <label htmlFor={inputId} className="button ad-drop-choose">Choose a file</label>
            <button type="button" className="ad-link-button ad-drop-sample" onClick={() => pick(SAMPLE)}>Use a sample snapshot</button>
          </div>
        </div>
      ) : (
        <div className="ad-snap-preview">
          <div className="ad-snap-filerow">
            <Icon name="file-plain" size={15} />
            <span className="ad-snap-filename">{fileName}</span>
            {result ? null : <button type="button" id={`${inputId}-change`} className="ad-link-button" aria-label={`Change file ${fileName}`} onClick={clear}>Change</button>}
          </div>
          {preview ? (
            <>
              <h3 className="ad-snap-label">Preview · {plural(preview.length, 'service')} detected</h3>
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
