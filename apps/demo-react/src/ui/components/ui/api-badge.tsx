// Deep Ink · api-badge@0.2.0 · copied from packages/registry. You own this file.
import { Fragment, type HTMLAttributes } from 'react';

export type Protocol = 'REST' | 'SOAP' | 'EVENT' | 'gRPC' | 'GRAPHQL' | 'DIRECT' | 'A2A';
export type ProofStatus = 'success' | 'danger' | 'warning' | 'info' | 'action' | 'neutral';

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
  /** More proof values after `value`, each its own filled segment ("samples │ 7 │ +1 AI"). */
  values?: ReadonlyArray<{ value: string; status?: ProofStatus }>;
  /** `card`: 13px, for badge walls. `lg` sets the name in the brand font at 17px (beside a page title); `xl` at 30px (the badge is the page title). */
  size?: 'sm' | 'md' | 'card' | 'lg' | 'xl';
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

export function ApiBadge({ protocol, arazzo, name, version, label, value, status = 'neutral', values, size = 'md', className, ...rest }: ApiBadgeProps) {
  const isProof = !arazzo && label !== undefined;
  const type = arazzo ? 'ARAZZO' : isProof ? label : (protocol ?? 'REST');
  const dataProtocol = arazzo ? 'arazzo' : isProof ? undefined : PROTOCOL_ATTR[protocol ?? 'REST'];
  const main = isProof ? value : name;
  const proofIcon = isProof ? filled(status) : undefined;
  return (
    <span
      {...rest}
      className={['api-badge', className].filter(Boolean).join(' ')}
      data-protocol={dataProtocol}
      data-status={isProof ? status : undefined}
      data-size={size}
    >
      <span className="api-badge-type">{type}</span>{' '}
      {main ? (
        <span className="api-badge-name">
          {main}
          {proofIcon ? (
            <>
              {' '}
              <span className="sr-only">({STATUS_WORD[proofIcon]})</span>
            </>
          ) : null}
        </span>
      ) : null}{' '}
      {!isProof && version ? <span className="api-badge-version">{version}</span> : null}
      {isProof
        ? values?.map((v, i) => {
            const icon = filled(v.status);
            return (
              <Fragment key={i}>
                {' '}
                <span className="api-badge-value" data-status={v.status ?? 'neutral'}>
                  {v.value}
                  {icon ? (
                    <>
                      {' '}
                      <span className="sr-only">({STATUS_WORD[icon]})</span>
                    </>
                  ) : null}
                </span>
              </Fragment>
            );
          })
        : null}
    </span>
  );
}
