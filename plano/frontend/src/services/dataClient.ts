// plano/frontend/src/services/dataClient.ts
import api from "./apiService";
import type { Plan, ActionItem, SavedReport, NewPlanData } from "../types";

// PLANS
export async function getPlans(): Promise<Plan[]> {
  const { data } = await api.get<Plan[]>("/plans/");
  return data;
}

export async function createPlan(
  payload: NewPlanData,
  items: Omit<ActionItem, "id">[] = []
): Promise<Plan> {
  const { data } = await api.post<Plan>("/plans/", { ...payload, items });
  return data;
}

export async function deletePlan(planId: number | string): Promise<void> {
  const id = typeof planId === "string" ? Number(planId) : planId;
  await api.delete(`/plans/${id}`);
}

// ACTION ITEMS
export async function getPlanActions(
  planId: number | string
): Promise<ActionItem[]> {
  const id = typeof planId === "string" ? Number(planId) : planId;
  const { data } = await api.get<ActionItem[]>(`/plans/${id}/actions`);
  return data;
}

export async function addActionItem(
  planId: number | string,
  item: Omit<ActionItem, "id">
): Promise<ActionItem> {
  const id = typeof planId === "string" ? Number(planId) : planId;
  const { data } = await api.post<ActionItem>(`/plans/${id}/actions`, item);
  return data;
}

// REPORTS
export async function getSavedReports(): Promise<SavedReport[]> {
  const { data } = await api.get<SavedReport[]>("/reports/");
  return data;
}

export async function saveReport(
  planId: number | string,
  reportName: string,
  summaryContent: string,
  dataUsed: ActionItem[]
): Promise<SavedReport> {
  const id = typeof planId === "string" ? Number(planId) : planId;
  const { data } = await api.post<SavedReport>(`/reports/`, {
    planId: id,
    reportName,
    summaryContent,
    dataUsed,
  });
  return data;
}
