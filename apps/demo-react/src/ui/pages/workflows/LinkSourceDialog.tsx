import { useState } from 'react';
import type { ArazzoDocument, SourceDescription } from '@/domain/arazzo';
import type { ServiceSummary } from '@/domain/shared';
import { useAnnounce, useQuery, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { RadioGroup } from '@/ui/components/ui/checkbox';
import { Skeleton } from '@/ui/components/ui/skeleton';
import { Dialog } from '@/ui/components/ui/dialog';

export interface LinkSourceDialogProps {
  open: boolean;
  onClose: () => void;
  document: ArazzoDocument;
  source: SourceDescription;
  /** Called once the source is linked, with the API it now points to. */
  onLinked: (service: ServiceSummary) => void;
}

const HINT = (file: string) => `The API for ${file} may not be in Microcks yet: import it first, or pick the API to link here.`;

/** "Link a source" dialog: pick the Microcks API a source description of an Arazzo document points to. */
export function LinkSourceDialog({ open, onClose, document, source, onLinked }: LinkSourceDialogProps) {
  const uc = useUseCases();
  const announce = useAnnounce();
  const services = useQuery(() => uc.catalog.listServices(), []);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wanted = source.type === 'asyncapi' ? 'EVENT' : 'REST';
  const candidates = (services.data ?? []).filter((s) => s.protocol === wanted || (source.type === 'openapi' && s.protocol === 'DIRECT'));
  const file = source.link.status === 'not-linked' ? source.link.expectedFile : source.url;
  // Preselect an API only when its name AND the version of the declared file match ("beer-catalog-1.0" never picks 0.9).
  const fileVersion = /-(\d+(?:\.\d+)+)-/.exec(file)?.[1];
  const hint = candidates.find(
    (s) =>
      s.name.toLowerCase().replace(/\s+/g, '').includes(source.name.toLowerCase().replace(/catalog$/, '')) &&
      (!fileVersion || s.version === fileVersion),
  );
  const selected = choice || hint?.id || '';

  const link = async () => {
    const service = candidates.find((s) => s.id === selected);
    if (!service) {
      setError('Pick an API to link.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await uc.arazzo.linkSource(document.id, source.name, service.id);
      announce(`${source.name} is now linked to ${service.name} ${service.version}.`);
      onLinked(service);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Link ${source.name}`}
      description={`${document.file} declares ${source.name} as ${source.url}. ${HINT(file)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={link}>
            Link this API
          </Button>
        </>
      }
    >
      {services.status === 'loading' && !services.data ? (
        <div aria-busy="true">
          <Skeleton lines={3} />
        </div>
      ) : (
        <RadioGroup
          legend="Microcks API"
          value={selected}
          onChange={setChoice}
          error={error ?? undefined}
          options={candidates.map((s) => ({
            value: s.id,
            label: <ApiBadge protocol={s.protocol} name={s.name} version={s.version} size="sm" />,
            description: `${s.operationCount} ${s.operationCount === 1 ? 'operation' : 'operations'} · ${s.format}`,
          }))}
        />
      )}
      {candidates.length === 0 && services.status === 'success' ? (
        <Callout tone="warning" title="No matching API in the catalogue">
          Import {file} first, then come back.
        </Callout>
      ) : null}
    </Dialog>
  );
}
