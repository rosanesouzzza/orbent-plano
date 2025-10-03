const raw = import.meta.env.VITE_API_BASE_URL;
if (!raw) {
  console.error("Faltou configurar VITE_API_BASE_URL.");
}
export const API_BASE_URL = (raw || "").trim().replace(/\/$/, "");
