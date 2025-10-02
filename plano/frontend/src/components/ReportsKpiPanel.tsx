import React from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts'

type KPIs = {
  total_actions: number
  status: Record<string, number>
  pillar: Record<string, number>
  department: Record<string, number>
  completion_over_time: { date: string; count: number }[]
}

type Props = {
  kpis: KPIs
}

const palette = [
  '#4f46e5', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444',
  '#a78bfa', '#10b981', '#fb7185', '#f97316', '#84cc16',
]

export default function ReportsKpiPanel({ kpis }: Props) {
  const statusData = Object.entries(kpis.status).map(([name, value]) => ({ name, value }))
  const pillarData = Object.entries(kpis.pillar).map(([name, value]) => ({ name, value }))
  const deptData   = Object.entries(kpis.department).map(([name, value]) => ({ name, value }))
  const completion = kpis.completion_over_time

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
      {/* STATUS (Pie) */}
      <Card title="Distribuição por Status">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label
            >
              {statusData.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* PILLAR (Bar) */}
      <Card title="Ações por Pilar">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={pillarData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value">
              {pillarData.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* DEPARTMENT (Bar) */}
      <Card title="Ações por Departamento">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={deptData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value">
              {deptData.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* COMPLETION OVER TIME (Line) */}
      <Card title="Conclusões ao Longo do Tempo">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={completion} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      padding: 12,
    }}>
      <div style={{ fontWeight: 700, margin: '4px 8px 8px', color: '#0f172a' }}>{title}</div>
      {children}
    </div>
  )
}
