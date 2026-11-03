// Deep Ink · api-badge@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';
import { Icon } from './icon';

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT';
export type ProofStatus = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

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
  /** Fill of the proof segment. */
  status?: ProofStatus;
  size?: 'md' | 'sm';
}

const PROTOCOL_ATTR: Record<Protocol, string> = { REST: 'rest', SOAP: 'soap', EVENT: 'event', gRPC: 'grpc', GRAPHQL: 'graphql', DIRECT: 'direct' };
const STATUS_ICON = { success: 'check', danger: 'cross', warning: 'warning' } as const;
const STATUS_WORD = { success: 'success', danger: 'error', warning: 'warning' } as const;

/**
 * Three segments: type, name, version (or label and value for a proof).
 * The visible text is the accessible name: "REST API Pastry 2.0" or "ARAZZO restock-pastry".
 */
export function ApiBadge({ protocol, arazzo, name, version, label, value, status = 'neutral', size = 'md', className, ...rest }: ApiBadgeProps) {
  const isProof = !arazzo && label !== undefined;
  const type = arazzo ? 'ARAZZO' : isProof ? label : (protocol ?? 'REST');
  const dataProtocol = arazzo ? 'arazzo' : isProof ? undefined : PROTOCOL_ATTR[protocol ?? 'REST'];
  const main = isProof ? value : name;
  const proofIcon = isProof && (status === 'success' || status === 'danger' || status === 'warning') ? status : undefined;
  return (
    <span
      {...rest}
      className={['di-api-badge', className].filter(Boolean).join(' ')}
      data-protocol={dataProtocol}
      data-status={isProof ? status : undefined}
      data-size={size}
    >
      <span className="di-api-badge-type">{type}</span>{' '}
      {main ? (
        <span className="di-api-badge-name">
          {proofIcon ? <Icon name={STATUS_ICON[proofIcon]} size={12} /> : null}
          {main}
          {proofIcon ? (
            <>
              {' '}
              <span className="di-sr-only">({STATUS_WORD[proofIcon]})</span>
            </>
          ) : null}
        </span>
      ) : null}{' '}
      {!isProof && version ? <span className="di-api-badge-version">{version}</span> : null}
    </span>
  );
}
