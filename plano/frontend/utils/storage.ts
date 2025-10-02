// src/utils/storage.ts
export function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (value == null) return fallback;
  try {
    // já é JSON válido?
    return JSON.parse(value) as T;
  } catch {
    // às vezes alguém salvou um objeto direto (vira "[object Object]")
    if (value === "[object Object]") return fallback;
    return fallback;
  }
}

export function setJSON(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage cheio / indisponível: ignore
  }
}

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return safeParseJSON<T>(raw, fallback);
  } catch {
    return fallback;
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
