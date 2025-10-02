import React from 'react';

export type ActionItem = {
  id: string;
  title: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  status?: string;
  department?: string;
  pillar?: string;
};

export function GanttChart({ actionItems }: { actionItems: ActionItem[] }) {
  // Gantt minimalista: uma barra por item, calculada na janela min/max
  if (!actionItems || actionItems.length === 0) {
    return <div style={{ padding: 16, fontStyle: 'italic' }}>Sem itens para exibir.</div>;
  }

  const parse = (s: string) => new Date(s + 'T00:00:00');
  const min = actionItems.reduce((m, a) => (parse(a.startDate) < m ? parse(a.startDate) : m), parse(actionItems[0].startDate));
  const max = actionItems.reduce((m, a) => (parse(a.endDate) > m ? parse(a.endDate) : m), parse(actionItems[0].endDate));
  const totalDays = Math.max(1, Math.round((+max - +min) / 86400000));

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Gantt (demo)</h3>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
        Janela: {min.toISOString().slice(0, 10)} → {max.toISOString().slice(0, 10)} ({totalDays} dias)
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {actionItems.map((a) => {
          const startOffset = Math.max(0, Math.round((+parse(a.startDate) - +min) / 86400000));
          const duration = Math.max(1, Math.round((+parse(a.endDate) - +parse(a.startDate)) / 86400000));
          const left = (startOffset / totalDays) * 100;
          const width = (duration / totalDays) * 100;

          return (
            <div key={a.id} style={{ background: '#f8f8f8', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontWeight: 600 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {a.startDate} → {a.endDate} {a.status ? `• ${a.status}` : ''} {a.department ? `• ${a.department}` : ''}{' '}
                {a.pillar ? `• ${a.pillar}` : ''}
              </div>
              <div style={{ position: 'relative', height: 10, background: '#eee', borderRadius: 5, marginTop: 8 }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    height: '100%',
                    borderRadius: 5,
                    background: '#4f46e5',
                  }}
                  title={`${a.title} (${a.startDate} → ${a.endDate})`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
