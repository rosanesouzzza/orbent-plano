// src/pages/DashboardPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import "chart.js/auto"; // registra automaticamente os elementos (ArcElement, BarElement, etc.)
import {
  getPlans,
  getPlanActions,
  type Plan,
  type Action,
} from "@/lib/api";

// ---- Cores (Orbent) ----
const COLORS = {
  green: "#10B981",
  blue: "#3B82F6",
  orange: "#F59E0B",
  purple: "#6366F1",
  teal: "#14B8A6",
  grayGrid: "#E5E7EB",
};

// ---- Helpers de agregação ----
function by<T extends string | number>(arr: Action[], pick: (a: Action) => T) {
  return arr.reduce<Record<T, number>>((acc, a) => {
    const k = pick(a);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

function countStatus(rows: Action[]) {
  return {
    DONE: rows.filter((a) => a.status === "DONE").length,
    IN_PROGRESS: rows.filter((a) => a.status === "IN_PROGRESS").length,
    PENDING: rows.filter((a) => a.status === "PENDING").length,
  };
}

function donePerDay(rows: Action[]) {
  // agrupa por data de fim apenas para status DONE
  const onlyDone = rows.filter((a) => a.status === "DONE" && a.end_date);
  const byDay = onlyDone.reduce<Record<string, number>>((acc, a) => {
    const day = (a.end_date ?? "").slice(0, 10);
    if (!day) return acc;
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});
  const labels = Object.keys(byDay).sort();
  const values = labels.map((d) => byDay[d]);
  return { labels, values };
}

// ---- Opções Chart.js padrão ----
const baseBarOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { color: COLORS.grayGrid },
      ticks: { font: { size: 12 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: COLORS.grayGrid },
      ticks: { precision: 0, font: { size: 12 } },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
};

const baseLineOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { color: COLORS.grayGrid },
      ticks: { font: { size: 12 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: COLORS.grayGrid },
      ticks: { precision: 0, font: { size: 12 } },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
};

export default function DashboardPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<number | null>(null);
  const [rows, setRows] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // carrega os planos
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getPlans();
        if (!mounted) return;
        setPlans(data);
        if (data.length && planId == null) setPlanId(data[0].id);
      } catch (e: any) {
        setErr("Falha ao carregar planos.");
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // carrega ações do plano selecionado
  useEffect(() => {
    if (!planId) return;
    let mounted = true;
    setLoading(true);
    setErr(null);
    (async () => {
      try {
        const data = await getPlanActions(planId);
        if (!mounted) return;
        setRows(data);
      } catch (e: any) {
        setErr("Falha ao carregar ações do plano.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [planId]);

  // ---- KPIs ----
  const status = useMemo(() => countStatus(rows), [rows]);
  const total = rows.length;

  // ---- Agregações para gráficos ----
  const perPillar = useMemo(
    () => by(rows, (a) => (a.pillar ?? "—") as string),
    [rows]
  );
  const perDept = useMemo(
    () => by(rows, (a) => (a.department ?? "—") as string),
    [rows]
  );
  const perDay = useMemo(() => donePerDay(rows), [rows]);

  // ---- Datasets ----
  const pieData = {
    labels: ["DONE", "IN_PROGRESS", "PENDING"],
    datasets: [
      {
        data: [status.DONE, status.IN_PROGRESS, status.PENDING],
        backgroundColor: [COLORS.green, COLORS.blue, COLORS.orange],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const pillarData = {
    labels: Object.keys(perPillar),
    datasets: [
      {
        label: "Ações por Pilar",
        data: Object.values(perPillar),
        backgroundColor: COLORS.purple,
      },
    ],
  };

  const deptData = {
    labels: Object.keys(perDept),
    datasets: [
      {
        label: "Ações por Departamento",
        data: Object.values(perDept),
        backgroundColor: COLORS.teal,
      },
    ],
  };

  const lineData = {
    labels: perDay.labels,
    datasets: [
      {
        label: "Conclusões por dia",
        data: perDay.values,
        borderColor: COLORS.blue,
        backgroundColor: COLORS.blue,
        tension: 0.3,
        fill: false,
        pointRadius: 3,
      },
    ],
  };

  // ---- UI ----
  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ fontWeight: 600 }}>Plano:</label>
        <select
          value={planId ?? ""}
          onChange={(e) => setPlanId(Number(e.target.value))}
          className="btn secondary"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} — {p.name}
            </option>
          ))}
        </select>
      </div>

      <div
        className="grid mt-24"
        style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
      >
        <Kpi title="Total" value={total} />
        <Kpi title="PENDING" value={status.PENDING} />
        <Kpi title="IN_PROGRESS" value={status.IN_PROGRESS} />
        <Kpi title="DONE" value={status.DONE} />
      </div>

      {err && (
        <div className="card mt-24" style={{ color: "#b91c1c" }}>
          {err}
        </div>
      )}

      {loading ? (
        <div className="card mt-24">Carregando…</div>
      ) : rows.length === 0 ? (
        <div className="card mt-24">Sem ações para este plano.</div>
      ) : (
        <>
          {/* 3 gráficos superiores */}
          <div
            className="grid mt-24"
            style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
          >
            <div className="card" style={{ height: 360 }}>
              <h3 style={{ marginBottom: 8 }}>Distribuição por Status</h3>
              <div style={{ height: 300 }}>
                <Pie data={pieData} />
              </div>
            </div>

            <div className="card" style={{ height: 360 }}>
              <h3 style={{ marginBottom: 8 }}>Ações por Pilar</h3>
              <div style={{ height: 300 }}>
                <Bar data={pillarData} options={baseBarOptions} />
              </div>
            </div>

            <div className="card" style={{ height: 360 }}>
              <h3 style={{ marginBottom: 8 }}>Ações por Departamento</h3>
              <div style={{ height: 300 }}>
                <Bar data={deptData} options={baseBarOptions} />
              </div>
            </div>
          </div>

          {/* linha de conclusões */}
          <div className="card mt-24" style={{ height: 380 }}>
            <h3 style={{ marginBottom: 8 }}>Conclusões ao Longo do Tempo</h3>
            <div style={{ height: 320 }}>
              <Line data={lineData} options={baseLineOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---- Componente simples de KPI ----
function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
