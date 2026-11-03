export interface SessionCall {
  n: number;
  method: string;
  path: string;
  httpStatus: number;
  /** Matching step id, or `unexpected`. */
  stepId: string;
  contract: { state: 'pass' | 'fail'; text: string };
  dataPassing: { state: 'pass' | 'fail' | 'off'; text: string };
}

/** A verification session (`x-microcks-session` header). */
export interface Session {
  id: string;
  /** The application that calls the mocks, e.g. "checkout-web · saga tests". */
  app: string;
  documentId: string;
  workflowId: string;
  state: 'open' | 'closed';
  openedAt: string;
  inputs: Record<string, unknown>;
  /** Step to fail and the example that answers it, when failure injection is on. */
  failureInjection?: { stepId: string; example: string };
  calls: SessionCall[];
  verification?: { result: 'SUCCESS' | 'FAILURE'; runNumber: number; problems: { lead: string; text: string }[] };
}
