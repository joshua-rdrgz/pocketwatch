/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Custom ENV Variables Go Here
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
