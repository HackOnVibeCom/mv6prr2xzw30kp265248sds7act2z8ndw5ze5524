/// <reference types="vite/client" />

/**
 * Typed frontend environment.
 *
 * Only non-secret values belong here — Vite inlines every VITE_ variable into
 * the browser bundle. Secrets live in server/.env and are read by the API
 * server, never by this app.
 */
interface ImportMetaEnv {
  /** Base URL of the AutoPromo API, e.g. "http://localhost:3001/api". */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
