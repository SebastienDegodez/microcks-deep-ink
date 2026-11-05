import { ApiBadge, StatusBadge } from '@microcks/deep-ink';

export default function ServiceHeader() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      <ApiBadge protocol="REST" name="API Pastry" version="2.0" size="lg" />
      <StatusBadge status="conformant" />
      <ApiBadge label="Conformance" value="92%" status="success" />
    </div>
  );
}
