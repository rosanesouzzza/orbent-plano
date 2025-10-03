import React, { useEffect, useMemo, useState } from "react";
// O import do seu dataClient pode ter um nome diferente, verifique o caminho correto.
import { getPlans } from "../lib/api"; 
import type { Plan, ActionItem } from "../types";
import {
  ActionStatus,
} from "../types";

// Gráficos
import { Pie, Bar, Line } from "react-chartjs-2";
import "chart.js/auto";

// ---- Cores (Orbent) ----
const COLORS = {
  green: "#10B981",
  blue: "#3B82F6",
  amber: "#F59E0B",
  red: "#EF4444",
  slate: "#64748B",
  violet: "#8B5CF6",
  teal: "#14B8A6",
  rose: "#F43F5E",
};

export default function DashboardPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega planos
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getPlans();
        setPlans(data);
      } catch (e: any) {
        setError(e?.message ?? "Erro ao carregar planos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Junta todas as ações
  const allActions = useMemo<ActionItem[]>(() => {
    // Garante que plans é um array antes de usar flatMap
    if (!Array.isArray(plans)) return []; 
    return plans.flatMap((p) => p.actionItems ?? []);
  }, [plans]);

  // Agrupamentos de status (mapeando para os enums atuais)
  const inProgressSet = new Set<ActionStatus>([
    ActionStatus.EM_ANDAMENTO,
    ActionStatus.PROCESSOS_INTENSIFICADOS,
    ActionStatus.AJUSTADAS_EM_EXECUCAO,
  ]);

  const statusCounts = useMemo(() => {
    let done = 0;
    let inProgress = 0;
    let pending = 0;

    for (const a of allActions) {
      if (a.status === ActionStatus.CONCLUIDO) done++;
      else if (a.status === ActionStatus.PENDENTE) pending++;
      else if (inProgressSet.has(a.status)) inProgress++;
    }
    return { done, inProgress, pending };
  }, [allActions]);

  // Distribuição por pilar
  const byPillar = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of allActions) {
      const k = a.pilarEstrategico || "—";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [allActions]);

  // Distribuição por departamento (achatando a lista)
  const byDepartment = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of allActions) {
      for (const d of a.departamentosEnvolvidos || []) {
        map.set(d, (map.get(d) ?? 0) + 1);
      }
    }
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [allActions]);

  // Evolução por mês (usando prazo)
  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of allActions) {
      if (!a.prazo) continue;
      const dt = new Date(a.prazo);
      if (isNaN(+dt)) continue;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const arr = Array.from(map, ([month, value]) => ({ month, value }));
    arr.sort((x, y) => x.month.localeCompare(y.month));
    return arr;
  }, [allActions]);

  if (loading) return <div className="p-6">Carregando dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // ---------------- ChartJS datasets ----------------
  const statusPieData = {
    labels: ["Concluídas", "Em andamento", "Pendentes"],
    datasets: [
      {
        data: [statusCounts.done, statusCounts.inProgress, statusCounts.pending],
        backgroundColor: [COLORS.green, COLORS.blue, COLORS.amber],
        borderWidth: 0,
      },
    ],
  };

  const pillarBarData = {
    labels: byPillar.map((p) => p.name),
    datasets: [
      {
        label: "Ações por pilar",
        data: byPillar.map((p) => p.value),
        backgroundColor: COLORS.violet,
      },
    ],
  };

  const departBarData = {
    labels: byDepartment.map((d) => d.name),
    datasets: [
      {
        label: "Ações por departamento",
        data: byDepartment.map((d) => d.value),
        backgroundColor: COLORS.teal,
      },
    ],
  };

  const monthLineData = {
    labels: byMonth.map((m) => m.month),
    datasets: [
      {
        label: "Ações com prazo por mês",
        data: byMonth.map((m) => m.value),
        borderColor: COLORS.blue,
        backgroundColor: COLORS.blue,
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-slate-600">
          {plans.length} plano(s) • {allActions.length} ação(ões)
        </p>
      </header>

      {/* Cards de status */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-slate-500 text-sm">Concluídas</div>
          <div className="text-3xl font-bold text-green-600">{statusCounts.done}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-slate-500 text-sm">Em andamento</div>
          <div className="text-3xl font-bold text-blue-600">{statusCounts.inProgress}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-slate-500 text-sm">Pendentes</div>
          <div className="text-3xl font-bold text-amber-600">{statusCounts.pending}</div>
        </div>
      </section>

      {/* Tabela rápida de planos */}
      <section className="rounded-lg border p-4">
        <h2 className="font-medium mb-3">Planos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Código</th>
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">Cliente</th>
                <th className="py-2 pr-3">Ações</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            {/* AQUI ESTÃO AS CORREÇÕES FINAIS PARA EVITAR O ERRO
            */}
            // Em DashboardPage.tsx

<tbody>
  {Array.isArray(plans) && plans.map((p) => (
    <tr key={p.id} className="border-b">
      {/* Aqui estava o problema. Não existe 'p.planCode'.
        Vamos usar 'p.id' ou outro campo que faça sentido.
      */}
      <td className="py-2 pr-3">{p.id}</td>

      {/* Trocamos 'p.planName' por 'p.name' */}
      <td className="py-2 pr-3">{p.name}</td>

      {/* Trocamos 'p.clientName' por 'p.owner' */}
      <td className="py-2 pr-3">{p.owner}</td>
      
      {/* O resto continua igual e já estava correto */}
      <td className="py-2 pr-3">{(p.actionItems ?? []).length}</td>
      <td className="py-2 pr-3">{p.status}</td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </section>

      {/* Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">Status das ações</h3>
          <Pie data={statusPieData} />
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">Ações por pilar</h3>
          <Bar data={pillarBarData} />
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">Ações por departamento</h3>
          <Bar data={departBarData} />
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="font-medium mb-3">Prazo de ações por mês</h3>
          <Line data={monthLineData} />
        </div>
      </section>
    </div>
  );
}