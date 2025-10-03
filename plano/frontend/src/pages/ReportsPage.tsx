import React, { useEffect, useState } from 'react';
import { getPlans, getPlanActions } from '../services/dataClient';
import type { Plan, ActionItem } from '../types';

export default function ReportsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const data = await getPlans();
      setPlans(data);
      if (data.length) {
        setSelected(data[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (selected != null) {
        const acts = await getPlanActions(selected);
        setActions(acts);
      }
    })();
  }, [selected]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Relatórios</h1>

      <select
        className="border rounded px-3 py-2 mb-4"
        value={selected ?? ''}
        onChange={(e) => setSelected(Number(e.target.value))}
      >
        <option value="" disabled>Selecione um plano</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.planCode} — {p.planName}
          </option>
        ))}
      </select>

      <div className="rounded border p-3">
        <div className="font-medium mb-2">Ações do plano</div>
        <ul className="list-disc ml-6 space-y-1">
          {actions.map((a) => (
            <li key={a.id}>
              {a.desvioPontoMelhoria} — <span className="text-gray-600">{a.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
