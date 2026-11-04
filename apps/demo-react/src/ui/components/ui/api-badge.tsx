// Deep Ink · api-badge@0.2.0 · copied from packages/registry. You own this file.
import { Fragment, type HTMLAttributes } from 'react';
import { Icon, type IconName } from './icon';

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';
/** `text` / `plain`: unfilled value in --text at 600 / 400; `positive`: unfilled value in --success (the word says it). */
export type ProofStatus = 'success' | 'danger' | 'warning' | 'info' | 'action' | 'neutral' | 'muted' | 'text' | 'plain' | 'positive' | 'protocol';

/** One proof value. `icon` leads the value (12px, stroke 3); with `iconLabel` and no `value` the icon stands alone and `iconLabel` is its hidden name. */
export interface ProofValue {
  value?: string;
  status?: ProofStatus;
  icon?: IconName;
  /** Hidden word read with an icon-only value ("supported"). Never rely on the icon or the colour alone. */
  iconLabel?: string;
}

export interface ApiBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Left segment for an API badge. Ignored when `label` or `arazzo` is set. */
  protocol?: Protocol;
  /** Renders the inverted ARAZZO workflow segment. */
  arazzo?: boolean;
  name?: string;
  version?: string;
  /** Proof badge: metric label (left) and value (right). */
  label?: string;
  value?: string;
  /** Fill of the proof segment. `protocol`: the fill of `protocol` with --on-proto text ("skills │ 3" on A2A). */
  status?: ProofStatus;
  /** Proof: an icon before the value ("last test │ ✕ 13/15", "result │ ✓ passed"). Opt-in: proofs have no icon by default. */
  icon?: IconName;
  /** Proof: hidden name of an icon-only value (no `value`): "streaming │ ✓" reads "streaming supported". */
  iconLabel?: string;
  /** More proof values after `value`, each its own filled segment ("samples │ 7 │ +1 AI"). */
  values?: ReadonlyArray<ProofValue>;
  /** Version colour: `muted` (default for md, sm), `text` (default for compact and card, as on Hub, Sources, Cockpit). */
  versionTone?: 'muted' | 'text';
  /** `sm`: 11px (Cockpit counts, Tests, Admin, Traces). `compact`: 12px with tight segments (Sources, Hub, Workflows rows). `card`: 13px, for badge walls. `lg` sets the name in the brand font at 17px (beside a page title); `xl` at 30px (the badge is the page title). */
  size?: 'sm' | 'compact' | 'md' | 'card' | 'lg' | 'xl';
}

const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct', A2A: 'a2a' };
const STATUS_WORD = { success: 'success', danger: 'error', warning: 'warning' } as const;

/**
 * Three segments: type, name, version (or label and value for a proof).
 * The visible text is the accessible name: "REST API Pastry 2.0" or "ARAZZO restock-pastry".
 */
function filled(status: ProofStatus | undefined): 'success' | 'danger' | 'warning' | undefined {
  return status === 'success' || status === 'danger' || status === 'warning' ? status : undefined;
}

function ProofContent({ v }: { v: ProofValue }) {
  const word = filled(v.status);
  return (
    <>
      {v.icon ? <Icon name={v.icon} size={12} /> : null}
      {v.value}
      {v.iconLabel ? <span className="sr-only">{v.value ? ` ${v.iconLabel}` : v.iconLabel}</span> : null}
      {word ? (
        <>
          {' '}
          <span className="sr-only">({STATUS_WORD[word]})</span>
        </>
      ) : null}
    </>
  );
}

export function ApiBadge({ protocol, arazzo, name, version, label, value, status = 'neutral', icon, iconLabel, values, versionTone, size = 'md', className, ...rest }: ApiBadgeProps) {
  const isProof = !arazzo && label !== undefined;
  const type = arazzo ? 'ARAZZO' : isProof ? label : (protocol ?? 'REST');
  const dataProtocol = arazzo ? 'arazzo' : isProof ? undefined : PROTOCOL_ATTR[protocol ?? 'REST'];
  const main = isProof ? value : name;
  const proofFill = isProof && status === 'protocol' ? PROTOCOL_ATTR[protocol ?? 'REST'] : undefined;
  return (
    <span
      {...rest}
      className={['api-badge', className].filter(Boolean).join(' ')}
      data-protocol={dataProtocol}
      data-status={isProof ? status : undefined}
      data-size={size}
      data-fill={proofFill}
      data-version={versionTone}
    >
      <span className="api-badge-type">{type}</span>{' '}
      {isProof && (main || icon) ? (
        <span className="api-badge-name" data-icon-only={icon && !main ? '' : undefined}>
          <ProofContent v={{ value: main, status, icon, iconLabel }} />
        </span>
      ) : main ? (
        <span className="api-badge-name">{main}</span>
      ) : null}{' '}
      {!isProof && version ? <span className="api-badge-version">{version}</span> : null}
      {isProof
        ? values?.map((v, i) => (
            <Fragment key={i}>
              {' '}
              <span className="api-badge-value" data-status={v.status ?? 'neutral'} data-icon-only={v.icon && !v.value ? '' : undefined}>
                <ProofContent v={v} />
              </span>
            </Fragment>
          ))
        : null}
    </span>
  );
}
