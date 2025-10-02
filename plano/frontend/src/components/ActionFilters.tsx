// src/components/ActionFilters.tsx
import React from "react";

export type Filters = {
  status: "" | "PENDING" | "IN_PROGRESS" | "DONE";
  department: string;
  pillar: string;
  search: string;
};

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
  onClear?: () => void;
};

export default function ActionFilters({ value, onChange, onClear }: Props) {
  function update<K extends keyof Filters>(key: K, val: Filters[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr 1fr 1fr 140px",
        gap: 12,
        alignItems: "end",
        marginBottom: 16,
      }}
    >
      <div>
        <label style={{ display: "block", fontSize: 12, color: "#555" }}>
          Status
        </label>
        <select
          value={value.status}
          onChange={(e) =>
            update("status", e.target.value as Filters["status"])
          }
          style={{ width: "100%", padding: 8 }}
        >
          <option value="">Todos</option>
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
          value={value.department}
          onChange={(e) => update("department", e.target.value)}
          placeholder="ex.: Qualidade"
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: 12, color: "#555" }}>
          Pilar
        </label>
        <input
          value={value.pillar}
          onChange={(e) => update("pillar", e.target.value)}
          placeholder="ex.: Padronização"
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: 12, color: "#555" }}>
          Busca (título)
        </label>
        <input
          value={value.search}
          onChange={(e) => update("search", e.target.value)}
          placeholder="contém no título…"
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => onChange(value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            flex: 1,
          }}
        >
          Aplicar
        </button>
        <button
          type="button"
          onClick={onClear}
          style={{
            padding: "8px 12px",
            border: "1px solid #ddd",
            background: "#f6f6f6",
            cursor: "pointer",
            flex: 1,
          }}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
