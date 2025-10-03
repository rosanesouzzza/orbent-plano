/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK?: string; // "1" para mock, "0" ou vazio para backend
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
