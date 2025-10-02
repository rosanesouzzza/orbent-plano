// src/components/ActionForm.tsx
import React, { useEffect, useState } from "react";
// IMPORTE RELATIVO para evitar o erro do alias:
import Modal from "./Modal";
import { Action, ActionCreate } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  open: boolean;
  onClose: () => void;
  planId: number;
  editing?: Action | null;
  onSubmit: (payload: ActionCreate, editingId?: number) => Promise<void> | void;
};

const EMPTY: ActionCreate = {
  title: "",
  status: "PENDING",
  start_date: "",
  end_date: "",
  department: "",
  pillar: "",
};

// “Tipo tolerante” para cobrir diferentes APIs de toast
type ToastLike = {
  addToast?: (msg: string) => void;
  toast?: (msg: string) => void;
  success?: (msg: string) => void;
  error?: (msg: string) => void;
};

export default function ActionForm({
  open,
  onClose,
  planId,
  editing,
  onSubmit,
}: Props) {
  const toastApi = useToast() as unknown as ToastLike;

  const [form, setForm] = useState<ActionCreate>(EMPTY);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title ?? "",
        status: editing.status,
        start_date: editing.start_date ?? "",
        end_date: editing.end_date ?? "",
        department: editing.department ?? "",
        pillar: editing.pillar ?? "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [editing]);

  function update<K extends keyof ActionCreate>(key: K, val: ActionCreate[K]) {
    setForm((s) => ({ ...s, [key]: val }));
  }

  function notify(msg: string) {
    toastApi.addToast?.(msg) ??
      toastApi.toast?.(msg) ??
      toastApi.success?.(msg) ??
      toastApi.error?.(msg);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await onSubmit(form, editing?.id);
      notify(editing ? "Ação atualizada com sucesso!" : "Ação criada com sucesso!");
      onClose();
    } catch (err) {
      console.error(err);
      notify("Falha ao salvar ação.");
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>
        {editing ? "Editar ação" : "Nova ação"} (Plano {planId})
      </h3>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#555" }}>
            Título
          </label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
            placeholder="ex.: Revisão dos POPs"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#555" }}>
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                update("status", e.target.value as ActionCreate["status"])
              }
              style={{ width: "100%", padding: 8 }}
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#555" }}>
              Departamento
            </label>
            <input
              value={form.department ?? ""}
              onChange={(e) => update("department", e.target.value)}
              style={{ width: "100%", padding: 8 }}
              placeholder="ex.: Qualidade"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#555" }}>
              Pilar
            </label>
            <input
              value={form.pillar ?? ""}
              onChange={(e) => update("pillar", e.target.value)}
              style={{ width: "100%", padding: 8 }}
              placeholder="ex.: Auditoria"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "#555" }}>
              Início
            </label>
            <input
              type="date"
              value={form.start_date ?? ""}
              onChange={(e) => update("start_date", e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, color: "#555" }}>
            Fim
          </label>
          <input
            type="date"
            value={form.end_date ?? ""}
            onChange={(e) => update("end_date", e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 14px",
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              border: "1px solid #0ea5e9",
              background: "#0ea5e9",
              color: "#fff",
              cursor: "pointer",
              flex: 1,
            }}
          >
            {editing ? "Salvar" : "Criar ação"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
