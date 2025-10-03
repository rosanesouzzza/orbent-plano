// src/pages/HomePage.tsx
import { useEffect, useState } from "react";
import { getPlans, type Plan } from "@/lib/api";

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPlans();
        setPlans(data);
      } catch (e: any) {
        setErr(e?.message || "Falha ao carregar planos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="app-shell">
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>Orbent Action Plan</h1>
      <p style={{ color: "#4b5563", marginBottom: 24 }}>
        Bem-vindo! Use o menu acima para navegar.
      </p>

      <div className="card">
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Planos existentes</h2>

        {loading && <p>Carregando...</p>}
        {err && <p style={{ color: "crimson" }}>{err}</p>}

        {!loading && !err && plans.length === 0 && (
          <p>Nenhum plano encontrado. Crie um novo no backend (POST /plans/) e recarregue.</p>
        )}

        {!loading && !err && plans.length > 0 && (
          <ul style={{ listStyle: "disc", paddingLeft: 18 }}>
            {plans.map((p) => (
              <li key={p.id}>
                <strong>#{p.id}</strong> — {p.name} <em>(owner: {p.owner})</em>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
