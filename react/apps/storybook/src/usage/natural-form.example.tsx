import { useState } from 'react';
import { Button, Field, Input, Panel } from '@microcks/deep-ink';

export default function ImportFromUrl() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string>();
  const [imported, setImported] = useState<string>();

  return (
    <Panel title="Import from a URL" headingLevel={4} style={{ maxWidth: 520 }}>
      <form
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        onSubmit={(e) => {
          e.preventDefault();
          const ok = url.startsWith('https://');
          setError(ok ? undefined : 'Enter a URL that starts with https://.');
          setImported(ok ? url : undefined);
        }}
      >
        <Field label="Artifact URL" help="An OpenAPI, AsyncAPI or Postman file." error={error} required>
          {(control) => <Input {...control} type="url" mono value={url} onChange={(e) => setUrl(e.target.value)} />}
        </Field>
        <div>
          <Button type="submit" variant="primary" icon="upload">
            Import
          </Button>
        </div>
        <p role="status" style={{ margin: 0 }}>
          {imported ? `Queued: ${imported}` : ''}
        </p>
      </form>
    </Panel>
  );
}
