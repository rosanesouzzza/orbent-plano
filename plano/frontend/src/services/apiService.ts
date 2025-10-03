// plano/frontend/src/services/apiService.ts
import axios from "axios";

/**
 * 1) Tenta usar a env do Vite (Vercel/CI).
 * 2) Se estiver em domínio que não é localhost, força Render.
 * 3) Só cai pra localhost quando estiver rodando local.
 */
const envBase: string | undefined = (import.meta as any)?.env?.VITE_API_BASE_URL;

function resolveBaseURL(): string {
  if (envBase && envBase.trim()) return envBase.trim();

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Produção (Vercel, etc.)
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return "https://orbent-plano.onrender.com"; // backend Render
    }
  }
  // Desenvolvimento local
  return "http://localhost:8080";
}

export const API_BASE_URL = resolveBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export default api;
