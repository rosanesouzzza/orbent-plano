// src/pages/ReportsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { getPlans, getPlanActions, type Action, type Plan } from "@/lib/api";
import {
  exportActionsToCSV,
  exportActionsToXLSX,
  exportExecutivePDF,
  exportTablePng,
} from "@/utils/exportUtils";
import { useToast } from "@/contexts/ToastContext";

export default function ReportsPage() {
  const { addToast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const ps = await getPlans();
      setPlans(ps);
      if (ps.length) setSelectedPlan(ps[0].id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedPlan) return;
      setLoading(true);
      try {
        const data = await getPlanActions(selectedPlan);
        setActions(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedPlan]);

  const totals = useMemo(() => {
    const total = actions.length;
    const byStatus = actions.reduce(
      (acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<Action["status"], number>
    );
    return { total, byStatus };
  }, [actions]);

  function onExportCSV() {
    exportActionsToCSV(actions, "acoes.csv");
    addToast("CSV exportado.");
  }
  function onExportXLSX() {
    exportActionsToXLSX(actions, "acoes.xlsx");
    addToast("XLSX exportado.");
  }
  function onExportPDF() {
    exportExecutivePDF(actions, "executivo.pdf");
    addToast("PDF exportado.");
  }
  function onExportPNG() {
    exportTablePng("report-table", "tabela.png");
    addToast("PNG exportado.");
  }

  return (
    <div className="app-shell">
      <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>Reports</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label>Plano: </label>
          <select
            value={selectedPlan ?? ""}
            onChange={(e) => setSelectedPlan(Number(e.target.value))}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.name}
              </option>
            ))}
          </select>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="btn secondary" onClick={onExportCSV}>CSV</button>
            <button className="btn secondary" onClick={onExportXLSX}>Excel</button>
            <button className="btn secondary" onClick={onExportPDF}>PDF</button>
            <button className="btn secondary" onClick={onExportPNG}>PNG</button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            <p className="mb-16">
              Total: <b>{totals.total}</b> — PENDING: <b>{totals.byStatus.PENDING ?? 0}</b>,
              IN_PROGRESS: <b>{totals.byStatus.IN_PROGRESS ?? 0}</b>,
              DONE: <b>{totals.byStatus.DONE ?? 0}</b>
            </p>

            <table id="report-table" className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Status</th>
                  <th>Depto</th>
                  <th>Pilar</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.title}</td>
                    <td>{a.start_date ?? "-"}</td>
                    <td>{a.end_date ?? "-"}</td>
                    <td>{a.status}</td>
                    <td>{a.department ?? "-"}</td>
                    <td>{a.pillar ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
