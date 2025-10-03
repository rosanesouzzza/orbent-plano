import {
  ActionItem, Plan, NewPlanData, SavedReport,
  PlanStatus, PlanReason, ActionStatus, ActionType, ActionPriority
} from '../types';

// ---- DB em memória ----
type Db = {
  plans: Plan[];
  reports: SavedReport[];
  user: { id: number; name: string; email: string };
};

let db: Db = {
  plans: [
    {
      id: 1,
      planCode: 'ALU-001',
      clientName: 'Restaurante Matriz',
      planName: 'Melhorias Pós-Auditoria Interna',
      emissionDate: '2024-07-15',
      reason: PlanReason.AUDITORIA_INTERNA,
      ownerId: 1,
      planOwnerName: 'Coordenador de Qualidade',
      status: PlanStatus.EM_ANDAMENTO,
      actionItems: [
        {
          id: 1,
          desvioPontoMelhoria: 'Otimizar controle de temperatura dos freezers',
          origem: PlanReason.AUDITORIA_INTERNA,
          acaoParaMitigacao:
            'Auditorias internas + checagem de temperatura 2x ao dia.',
          departamentosEnvolvidos: ['Operações', 'Qualidade'],
          responsavel: 'Gerente de Operações',
          prazo: '2024-08-30',
          evidencia: 'Planilhas de controle preenchidas.',
          verificacao:
            'Sem não-conformidades de temperatura na próxima auditoria.',
          status: ActionStatus.AJUSTADAS_EM_EXECUCAO,
          tipo: ActionType.CORRETIVA,
          priority: ActionPriority.ALTA,
          pilarEstrategico: 'Qualidade e Segurança de Alimentos (Food Safety)',
          tags: ['temperatura', 'auditoria'],
        },
        {
          id: 2,
          desvioPontoMelhoria: 'Padronizar higienização de bancadas',
          origem: PlanReason.AUDITORIA_INTERNA,
          acaoParaMitigacao:
            'Treinar equipe nos POPs de higienização.',
          departamentosEnvolvidos: ['Operações', 'Recursos Humanos'],
          responsavel: 'Nutricionista de produção',
          prazo: '2024-09-15',
          evidencia: 'Lista de presença + material do treinamento.',
          verificacao: 'Redução de 95% em apontamentos.',
          status: ActionStatus.PROCESSOS_INTENSIFICADOS,
          tipo: ActionType.PREVENTIVA,
          priority: ActionPriority.MEDIA,
          pilarEstrategico: 'Qualidade e Segurança de Alimentos (Food Safety)',
          tags: ['higiene', 'treinamento'],
        },
      ],
    },
    {
      id: 2,
      planCode: 'ALU-002',
      clientName: 'Cliente Indústria B',
      planName: 'Plano de Ação - Feedback Cliente',
      emissionDate: '2024-06-20',
      conclusionDate: '2024-07-25',
      reason: PlanReason.FEEDBACK,
      ownerId: 1,
      planOwnerName: 'Diretora Comercial',
      status: PlanStatus.CONCLUIDO,
      actionItems: [
        {
          id: 3,
          desvioPontoMelhoria: 'Aumentar variedade no cardápio de saladas',
          origem: PlanReason.FEEDBACK,
          acaoParaMitigacao: 'Adicionar 3 novas opções semanais.',
          departamentosEnvolvidos: ['Pesquisa e Desenvolvimento', 'Operações'],
          responsavel: 'Nutricionista de produção',
          prazo: '2024-07-20',
          evidencia: 'Cardápios atualizados e fotos.',
          verificacao: "Satisfação +15% em 'variedade'.",
          status: ActionStatus.CONCLUIDO,
          tipo: ActionType.MELHORIA,
          priority: ActionPriority.MEDIA,
          pilarEstrategico: 'Experiência e Relacionamento com o Cliente',
          tags: ['cardapio', 'cliente'],
        },
      ],
    },
  ],
  reports: [],
  user: { id: 1, name: 'Usuário Padrão', email: 'user@orbent.com.br' },
};

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
const simulateApiCall = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(deepClone(data)), 40));

const findPlan = (planId: number): Plan => {
  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) throw new Error(`Plano ${planId} não encontrado.`);
  return plan;
};

// Usuário
export const getCurrentUser = () => simulateApiCall(db.user);

// Planos
export const getPlans = (): Promise<Plan[]> => simulateApiCall(db.plans);

export const createPlan = (
  data: NewPlanData,
  items: Omit<ActionItem, 'id'>[] = []
): Promise<Plan> => {
  const newId = db.plans.length ? Math.max(...db.plans.map((p) => p.id)) + 1 : 1;
  const planCode = `ALU-${String(newId).padStart(3, '0')}`;

  let nextActionId = 1;
  const newPlan: Plan = {
    ...data,
    id: newId,
    planCode,
    ownerId: db.user.id,
    status: PlanStatus.EM_ANDAMENTO,
    actionItems: items.map((i) => ({ ...i, id: nextActionId++ })),
  };

  db.plans.push(newPlan);
  return simulateApiCall(newPlan);
};

export const updatePlan = (updated: Plan): Promise<Plan> => {
  const idx = db.plans.findIndex((p) => p.id === updated.id);
  if (idx === -1) throw new Error(`Plano ${updated.id} não encontrado.`);
  db.plans[idx] = updated;
  return simulateApiCall(updated);
};

export const deletePlan = (planId: number): Promise<void> => {
  db.plans = db.plans.filter((p) => p.id !== planId);
  db.reports = db.reports.filter((r) => r.planId !== planId);
  return simulateApiCall(undefined);
};

// Ações
export const getPlanActions = (planId: number): Promise<ActionItem[]> =>
  simulateApiCall(findPlan(planId).actionItems);

export const addActionItem = (
  planId: number,
  item: Omit<ActionItem, 'id'>
): Promise<ActionItem> => {
  const plan = findPlan(planId);
  const newId = plan.actionItems.length
    ? Math.max(...plan.actionItems.map((a) => a.id)) + 1
    : 1;
  const created: ActionItem = { ...item, id: newId };
  plan.actionItems.push(created);
  return simulateApiCall(created);
};

export const addActionItemsBatch = (
  planId: number,
  items: Omit<ActionItem, 'id'>[]
): Promise<Plan> => {
  const plan = findPlan(planId);
  let next = plan.actionItems.length
    ? Math.max(...plan.actionItems.map((a) => a.id)) + 1
    : 1;
  const news = items.map((i) => ({ ...i, id: next++ }));
  plan.actionItems.push(...news);
  return simulateApiCall(plan);
};

export const updateActionItem = (
  planId: number,
  updated: ActionItem
): Promise<ActionItem> => {
  const plan = findPlan(planId);
  const idx = plan.actionItems.findIndex((a) => a.id === updated.id);
  if (idx === -1) throw new Error(`Ação ${updated.id} não encontrada.`);
  plan.actionItems[idx] = updated;
  return simulateApiCall(updated);
};

export const deleteActionItem = (
  planId: number,
  itemId: number
): Promise<void> => {
  const plan = findPlan(planId);
  plan.actionItems = plan.actionItems.filter((a) => a.id !== itemId);
  return simulateApiCall(undefined);
};

// Relatórios
export const getSavedReports = (): Promise<SavedReport[]> =>
  simulateApiCall(db.reports);

export const saveReport = (
  planId: number,
  reportName: string,
  summaryContent: string,
  dataUsed: ActionItem[]
): Promise<SavedReport> => {
  const newId = db.reports.length
    ? Math.max(...db.reports.map((r) => r.id)) + 1
    : 1;
  const rep: SavedReport = {
    id: newId,
    planId,
    reportName,
    summaryContent,
    dataUsed,
    generatedAt: new Date().toISOString(),
  };
  db.reports.push(rep);
  return simulateApiCall(rep);
};
