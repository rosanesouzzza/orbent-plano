// plano/frontend/src/lib/api.ts
import axios from "axios";
// Adicionamos 'ActionItem' aqui para a nova função
import type { Plan, ActionItem } from '../types';

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

// O seu "carro de entregas" (a instância do Axios)
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: 30000,
});

// A função que busca todos os planos (já estava correta)
export const getPlans = async (): Promise<Plan[]> => {
  try {
    const response = await api.get("/plans");
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return [];
  }
};

// ===================================================================
// AQUI ESTÁ A NOVA FUNÇÃO QUE ESTAVA FALTANDO
// ===================================================================
export const getPlanActions = async (planId: number): Promise<ActionItem[]> => {
  try {
    // A URL será algo como /plans/1/actions
    const response = await api.get(`/plans/${planId}/actions`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar ações para o plano ${planId}:`, error);
    return [];
  }
};