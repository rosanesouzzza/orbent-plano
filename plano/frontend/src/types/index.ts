import type { FC } from 'react';

// Tipos e enums padronizados para toda a app

export enum PlanStatus {
  EM_ANDAMENTO = "EM_ANDAMENTO",
  CONCLUIDO = "CONCLUIDO",
  CANCELADO = "CANCELADO",
}

export enum PlanReason {
  AUDITORIA_INTERNA = "AUDITORIA_INTERNA",
  AUDITORIA_EXTERNA = "AUDITORIA_EXTERNA",
  INCIDENTE = "INCIDENTE",
  FEEDBACK = "FEEDBACK",
  OUTROS = "OUTROS",
}

export enum ActionStatus {
  PENDENTE = "PENDENTE",
  EM_ANDAMENTO = "EM_ANDAMENTO",
  AJUSTADAS_EM_EXECUCAO = "AJUSTADAS_EM_EXECUCAO",
  PROCESSOS_INTENSIFICADOS = "PROCESSOS_INTENSIFICADOS",
  CONCLUIDO = "CONCLUIDO",
}

export enum ActionType {
  CORRETIVA = "CORRETIVA",
  PREVENTIVA = "PREVENTIVA",
  MELHORIA = "MELHORIA",
}

export enum ActionPriority {
  BAIXA = "BAIXA",
  MEDIA = "MEDIA",
  ALTA = "ALTA",
}

export interface ActionItem {
  id: number;
  desvioPontoMelhoria: string;
  origem: PlanReason;
  acaoParaMitigacao: string;
  departamentosEnvolvidos: string[];
  responsavel: string;
  prazo: string; // ISO
  evidencia?: string;
  verificacao?: string;
  status: ActionStatus;
  tipo: ActionType;
  priority: ActionPriority;
  pilarEstrategico: string;
  tags?: string[];
}

export interface Plan {
  id: number;
  planCode: string;
  clientName: string;
  planName: string;
  emissionDate: string; // ISO
  conclusionDate?: string; // ISO
  reason: PlanReason;
  ownerId: number;
  planOwnerName: string;
  status: PlanStatus;
  actionItems: ActionItem[];
  // A API também envia estes campos em alguns contextos
  name?: string;
  owner?: string;
}

export type NewPlanData = Omit<
  Plan,
  "id" | "planCode" | "status" | "actionItems" | "ownerId"
>;

export interface SavedReport {
  id: number;
  planId: number;
  reportName: string;
  summaryContent: string;
  dataUsed: ActionItem[];
  generatedAt: string; // ISO
}

export type PlanView =
  | "home"
  | "dashboard"
  | "plan"
  | "creator"
  | "report"
  | "global-report"
  | "ai-planner";

export interface NavItem {
  id: PlanView;
  label: string;
  icon: FC<{ className?: string }>;
}
