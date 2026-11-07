/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `http` (default: adapters call `/api/...`, answered by the MSW worker) or `memory` (in-memory adapters, no MSW). */
  readonly VITE_DEMO_BACKEND?: string;
}
