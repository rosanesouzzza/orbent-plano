// plano/frontend/src/lib/api.ts
import axios from "axios";

/**
 * Usa SEMPRE a variável VITE_API_BASE_URL definida na Vercel.
 * Sem fallback para localhost no build.
 */
const raw = import.meta.env.VITE_API_BASE_URL;
if (!raw) {
  // Ajuda no desenvolvimento: se faltar a env, exibe erro visível no console.
  console.error(
    "Faltou configurar VITE_API_BASE_URL. Defina nas variáveis da Vercel (ou .env.local para dev)."
  );
}

/** remove barra final se houver */
const BASE_URL = (raw || "").trim().replace(/\/$/, "");

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});
