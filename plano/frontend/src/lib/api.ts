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

// O seu "carro de entregas" (a instância do Axios)
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: 30000, // <-- ADICIONE ESTA LINHA (30 segundos)
});


// --- ADICIONE ESTE CÓDIGO NO FINAL DO ARQUIVO ---

// 1. Defina o formato (o "type") dos seus dados.
//    Este 'type Plan' é o mesmo que o seu HomePage.tsx está tentando importar.
export type Plan = {
  id: number; // ou string, dependendo do seu back-end
  name: string;
  // Adicione aqui os outros campos que seu plano tem...
  // Ex: description: string; status: string;
};

// 2. Crie e EXPORTE a função que está faltando (a "lista de tarefas").
export const getPlans = async (): Promise<Plan[]> => {
  try {
    // Usamos a instância 'api' que você criou para fazer a chamada ao back-end
    const response = await api.get("/plans");
    // O endpoint aqui ('/plans') deve ser exatamente o mesmo da sua API no back-end
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    // Retorna um array vazio em caso de erro para não quebrar a aplicação
    return [];
  }
};