/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPC_ADMIN_BASE_URL?: string;
  readonly VITE_COWORKER_HTTP?: string;
  readonly VITE_COWORKER_WS?: string;
  readonly VITE_COWORKER_API_TOKEN?: string;
  readonly VITE_CLOUD_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
