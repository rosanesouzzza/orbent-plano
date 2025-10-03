import React, { useEffect, useState } from 'react';
// Verifique se o caminho do import está correto
import { getPlans, getPlanActions } from '../lib/api'; 
import type { Plan, ActionItem } from '../types';

export default function ReportsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      // Usamos 'Array.isArray' para garantir que 'data' é um array
      const data = await getPlans();
      if (Array.isArray(data)) {
        setPlans(data);
        if (data.length > 0) {
          setSelected(data[0].id);
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (selected != null) {
        // Garantimos que getPlanActions retorna um array
        const acts = await getPlanActions(selected);
        setActions(Array.isArray(acts) ? acts : []);
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
        {/*
          Verificação de segurança para garantir que 'plans' é um array
        */}
        {Array.isArray(plans) && plans.map((p) => (
          <option key={p.id} value={p.id}>
            {/* AQUI ESTÁ A CORREÇÃO FINAL:
              Trocamos 'p.planCode' e 'p.planName' por 'p.id' e 'p.name'
            */}
            {p.id} — {p.name}
          </option>
        ))}
      </select>

      <div className="rounded border p-3">
        <div className="font-medium mb-2">Ações do plano</div>
        <ul className="list-disc ml-6 space-y-1">
          {/*
            Verificação de segurança para garantir que 'actions' é um array
          */}
          {Array.isArray(actions) && actions.map((a) => (
            <li key={a.id}>
              {a.desvioPontoMelhoria} — <span className="text-gray-600">{a.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}