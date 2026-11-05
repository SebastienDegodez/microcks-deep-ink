import { Button, Callout } from '@microcks/deep-ink';

export default function UnsavedChanges() {
  return (
    <Callout
      tone="warning"
      title="Unsaved dispatcher rules"
      actions={
        <>
          <Button variant="primary" size="sm">
            Save rules
          </Button>
          <Button variant="ghost" size="sm">
            Discard
          </Button>
        </>
      }
    >
      Your edits to the dispatcher of GET /pastries are not saved yet.
    </Callout>
  );
}
