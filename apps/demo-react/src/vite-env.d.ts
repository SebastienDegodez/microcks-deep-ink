/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `memory` (default) or `http` (adapters call `/api/...`, answered by the MSW worker). */
  readonly VITE_DEMO_BACKEND?: string;
}
