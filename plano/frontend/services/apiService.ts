
import { ActionItem, Plan, NewPlanData, SavedReport, PlanStatus, PlanReason, ActionStatus, ActionType, ActionPriority } from '../types';

// --- MOCK MODE DATABASE ---
// Os dados que antes estavam em `initial-data.json` e eram servidos pelo backend
// agora estão em memória para permitir que o frontend funcione de forma independente.

// @fix: Strongly type the db object and use enums to match the application's types.
let db: {
  plans: Plan[];
  reports: SavedReport[];
  user: {
    id: number;
    name: string;
    email: string;
  };
} = {
  plans: [
    {
      "id": 1,
      "planCode": "ALU-001",
      "clientName": "Restaurante Matriz",
      "planName": "Melhorias Pós-Auditoria Interna",
      "emissionDate": "2024-07-15",
      "reason": PlanReason.AUDITORIA_INTERNA,
      "ownerId": 1,
      "planOwnerName": "Coordenador de Qualidade",
      "status": PlanStatus.EM_ANDAMENTO,
      "actionItems": [
        {
          "id": 1,
          "desvioPontoMelhoria": "Otimizar controle de temperatura dos freezers",
          "origem": PlanReason.AUDITORIA_INTERNA,
          "acaoParaMitigacao": "Reforçar e manter as auditorias internas já previstas no escopo, com checagem de temperatura 2x ao dia.",
          "departamentosEnvolvidos": ["Operações", "Qualidade"],
          "responsavel": "Gerente de Operações",
          "prazo": "2024-08-30",
          "evidencia": "Planilhas de controle de temperatura preenchidas.",
          "verificacao": "Ausência de não-conformidades de temperatura na próxima auditoria.",
          "status": ActionStatus.AJUSTADAS_EM_EXECUCAO,
          "tipo": ActionType.CORRETIVA,
          "priority": ActionPriority.ALTA,
          "pilarEstrategico": "Qualidade e Segurança de Alimentos (Food Safety)",
          "tags": ["temperatura", "auditoria"]
        },
        {
          "id": 2,
          "desvioPontoMelhoria": "Padronizar higienização de bancadas",
          "origem": PlanReason.AUDITORIA_INTERNA,
          "acaoParaMitigacao": "Intensificar treinamentos com a equipe sobre os procedimentos operacionais padrão (POPs) de higienização.",
          "departamentosEnvolvidos": ["Operações", "Recursos Humanos"],
          "responsavel": "Nutricionista de produção",
          "prazo": "2024-09-15",
          "evidencia": "Lista de presença e material do treinamento.",
          "verificacao": "Redução de 95% em apontamentos de higienização.",
          "status": ActionStatus.PROCESSOS_INTENSIFICADOS,
          "tipo": ActionType.PREVENTIVA,
          "priority": ActionPriority.MEDIA,
          "pilarEstrategico": "Qualidade e Segurança de Alimentos (Food Safety)",
          "tags": ["higiene", "treinamento"]
        }
      ]
    },
    {
      "id": 2,
      "planCode": "ALU-002",
      "clientName": "Cliente Indústria B",
      "planName": "Plano de Ação - Feedback Cliente",
      "emissionDate": "2024-06-20",
      "conclusionDate": "2024-07-25",
      "reason": PlanReason.FEEDBACK,
      "ownerId": 1,
      "planOwnerName": "Diretora Comercial",
      "status": PlanStatus.CONCLUIDO,
      "actionItems": [
         {
          "id": 3,
          "desvioPontoMelhoria": "Aumentar variedade no cardápio de saladas",
          "origem": PlanReason.FEEDBACK,
          "acaoParaMitigacao": "Aprimorar o planejamento de cardápios para incluir 3 novas opções de saladas semanais.",
          "departamentosEnvolvidos": ["Pesquisa e Desenvolvimento", "Operações"],
          "responsavel": "Nutricionista de produção",
          "prazo": "2024-07-20",
          "evidencia": "Cardápios atualizados e fotos das novas opções.",
          "verificacao": "Aumento de 15% na pesquisa de satisfação relacionada ao item 'variedade'.",
          "status": ActionStatus.CONCLUIDO,
          "tipo": ActionType.MELHORIA,
          "priority": ActionPriority.MEDIA,
          "pilarEstrategico": "Experiência e Relacionamento com o Cliente",
          "tags": ["cardapio", "cliente"]
        }
      ]
    }
  ],
  reports: [],
  user: {
    "id": 1,
    "name": "Usuário Padrão",
    "email": "user@orbent.com.br"
  }
};

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const simulateApiCall = <T>(data: T): Promise<T> => new Promise(resolve => setTimeout(() => resolve(deepClone(data)), 50));

const findPlan = (planId: number): Plan => {
    const plan = db.plans.find(p => p.id === planId);
    if (!plan) throw new Error(`Plano com ID ${planId} não encontrado.`);
    return plan;
}

// --- EXPORTED API FUNCTIONS ---

// USER
export const getCurrentUser = () => simulateApiCall(db.user);

// PLANS
export const getPlans = (): Promise<Plan[]> => simulateApiCall(db.plans);

export const createPlan = (data: NewPlanData, items: Omit<ActionItem, 'id'>[] = []): Promise<Plan> => {
    const newId = db.plans.length > 0 ? Math.max(...db.plans.map(p => p.id)) + 1 : 1;
    const planCode = `ALU-${String(newId).padStart(3, '0')}`;
    let nextActionId = 1;

    const newPlan: Plan = {
        ...data,
        id: newId,
        planCode,
        ownerId: db.user.id,
        status: PlanStatus.EM_ANDAMENTO,
        actionItems: items.map(item => ({
            ...item,
            id: nextActionId++,
        })),
    };

    db.plans.push(newPlan);
    return simulateApiCall(newPlan);
};

export const updatePlan = (updatedPlan: Plan): Promise<Plan> => {
    const index = db.plans.findIndex(p => p.id === updatedPlan.id);
    if (index === -1) throw new Error(`Plano com ID ${updatedPlan.id} não encontrado.`);
    db.plans[index] = updatedPlan;
    return simulateApiCall(updatedPlan);
};

export const deletePlan = (planId: number): Promise<void> => {
    db.plans = db.plans.filter(p => p.id !== planId);
    db.reports = db.reports.filter(r => r.planId !== planId);
    return simulateApiCall(undefined);
};

// ACTION ITEMS
export const addActionItem = (planId: number, item: Omit<ActionItem, 'id'>): Promise<ActionItem> => {
    const plan = findPlan(planId);
    const newActionId = plan.actionItems.length > 0 ? Math.max(...plan.actionItems.map(a => a.id)) + 1 : 1;
    const newAction: ActionItem = { ...item, id: newActionId };
    plan.actionItems.push(newAction);
    return simulateApiCall(newAction);
};

export const addActionItemsBatch = (planId: number, items: Omit<ActionItem, 'id'>[]): Promise<Plan> => {
    const plan = findPlan(planId);
    let nextId = plan.actionItems.length > 0 ? Math.max(...plan.actionItems.map(a => a.id)) + 1 : 1;
    const newActions: ActionItem[] = items.map(action => ({ ...action, id: nextId++ }));
    plan.actionItems.push(...newActions);
    return simulateApiCall(plan);
};

export const updateActionItem = (planId: number, updatedItem: ActionItem): Promise<ActionItem> => {
    const plan = findPlan(planId);
    const actionIndex = plan.actionItems.findIndex(a => a.id === updatedItem.id);
    if (actionIndex === -1) throw new Error(`Ação com ID ${updatedItem.id} não encontrada.`);
    plan.actionItems[actionIndex] = updatedItem;
    return simulateApiCall(updatedItem);
};

export const deleteActionItem = (planId: number, itemId: number): Promise<void> => {
    const plan = findPlan(planId);
    plan.actionItems = plan.actionItems.filter(a => a.id !== itemId);
    return simulateApiCall(undefined);
};

// REPORTS
export const getSavedReports = (): Promise<SavedReport[]> => simulateApiCall(db.reports);

export const saveReport = (planId: number, reportName: string, summaryContent: string, dataUsed: ActionItem[]): Promise<SavedReport> => {
    const newId = db.reports.length > 0 ? Math.max(...db.reports.map(r => r.id)) + 1 : 1;
    const newReport: SavedReport = {
        id: newId,
        planId,
        reportName,
        summaryContent,
        dataUsed,
        generatedAt: new Date().toISOString()
    };
    db.reports.push(newReport);
    return simulateApiCall(newReport);
};
