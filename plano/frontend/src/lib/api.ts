// src/lib/api.ts
import axios from "axios";

/** Base URL (Vite) */
export const BASE_URL =
  import.meta.env.VITE_API_URL?.toString() || "http://localhost:8080";

/** Axios client */
export const api = axios.create({ baseURL: BASE_URL });

/** Tipos */
export type Plan = { id: number; name: string; owner: string };

export type Action = {
  id: number;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  start_date?: string | null;
  end_date?: string | null;
  department?: string | null;
  pillar?: string | null;
  plan_id: number;
};

export type ActionCreate = Omit<Action, "id" | "plan_id">;
export type ActionUpdate = Partial<ActionCreate>;

/** Endpoints */
export async function getPlans(): Promise<Plan[]> {
  const { data } = await api.get<Plan[]>("/plans");
  return data;
}

export async function getPlanActions(planId: number): Promise<Action[]> {
  const { data } = await api.get<Action[]>(`/plans/${planId}/actions`);
  return data;
}

export async function createAction(
  planId: number,
  payload: ActionCreate
): Promise<Action> {
  const { data } = await api.post<Action>(`/plans/${planId}/actions`, payload);
  return data;
}

export async function updateAction(
  planId: number,
  actionId: number,
  payload: ActionUpdate
): Promise<Action> {
  const { data } = await api.put<Action>(
    `/plans/${planId}/actions/${actionId}`,
    payload
  );
  return data;
}

export async function deleteAction(
  planId: number,
  actionId: number
): Promise<{ ok: true }> {
  await api.delete(`/plans/${planId}/actions/${actionId}`);
  return { ok: true };
}

export default api;
