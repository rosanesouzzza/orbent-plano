import React, { useEffect, useState } from 'react';
import { getPlans } from '../services/dataClient';
import type { Plan } from '../types';

export default function HomePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPlans();
        setPlans(data);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar planos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Planos existentes</h1>
      <ul className="space-y-2">
        {plans.map((p: Plan) => (
          <li key={p.id} className="rounded border p-3">
            <div className="font-medium">{p.planCode} — {p.planName}</div>
            <div className="text-sm text-gray-600">
              Cliente: {p.clientName} • Ações: {p.actionItems.length}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
